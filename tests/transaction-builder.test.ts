import { describe, it, expect } from "vitest";
import { getTokenBySymbol } from "../lib/web3/tokens";
import { buildTransferTransaction } from "../lib/web3/transaction-builder";
import { parseUnits } from "viem";

/*
  测试文件说明（中文注释）

  本文件用 Vitest 对交易构建器相关功能做单元测试，覆盖点包括：
  - `getTokenBySymbol`：从代币表中根据 chainId 与 symbol 查询代币元数据。
  - `buildTransferTransaction`：构建 ETH 或 ERC20 转账交易的 PreparedTransaction。
  - `buildSwapTransaction` / `buildSupplyTransaction` / `buildWithdrawTransaction`：
    对 swap、supply、withdraw 三类交易构建器的基本输出结构断言（是否生成 approve、calldata、value 等）。

  测试策略与要点：
  - 大部分断言关注结构而非链上执行（例如：是否生成 approve、calldata 是否以 0x 开头、value 是否为预期 bigint）。
  - 使用受控的 chainId（11155111）和已知代币（USDC）作为输入以稳定返回代币元数据。
  - 对于需要合法 address 的构建器（如 deadline/recipient 参数会被 encode 编码），
    使用合法的 20 字节地址（例如 0x...dEaD）以避免 viem 的地址校验错误。
*/

describe("tokens.getTokenBySymbol", () => {
  it("returns USDC info for chain 11155111", () => {
    const token = getTokenBySymbol(11155111, "USDC");
    // 断言：查询到代币元数据并且字段符合预期
    expect(token).toBeDefined();
    expect(token?.symbol).toBe("USDC");
    expect(token?.decimals).toBe(6);
  });
});

describe("transaction-builder.buildTransferTransaction", () => {
  it("builds ETH transfer transaction", async () => {
    const intent: any = {
      id: "t1",
      type: "transfer",
      status: "pending",
      createdAt: Date.now(),
      params: {
        token: "ETH",
        amount: "0.1",
        to: "0x000000000000000000000000000000000000dEaD",
      },
    };

    // 传入 walletAddress 参数用于设置交易 recipient（构建时会把 recipient 放到 calldata 或 value 中）
    // 这里传入合法地址避免 viem 的 encode 校验错误（例如：'0xabc' 会报错）
    const txs = await buildTransferTransaction(intent, "0x000000000000000000000000000000000000dEaD" as any, 11155111);
    expect(txs).toHaveLength(1);
    const tx = txs[0];
    const expectedValue = parseUnits("0.1", 18);
    expect(tx.value).toBe(expectedValue);
    expect(tx.to.toLowerCase()).toBe("0x000000000000000000000000000000000000dead");
  });

  it("builds ERC20 transfer transaction", async () => {
    const intent: any = {
      id: "t2",
      type: "transfer",
      status: "pending",
      createdAt: Date.now(),
      params: {
        token: "USDC",
        amount: "10",
        to: "0x000000000000000000000000000000000000dEaD",
      },
    };

    // ERC20 转账构建：应生成一个向 ERC20 合约发起的 transfer calldata
    const txs = await buildTransferTransaction(intent, "0x000000000000000000000000000000000000dEaD" as any, 11155111);
    expect(txs).toHaveLength(1);
    const tx = txs[0];
    expect(tx.to.toLowerCase()).not.toBe("0x000000000000000000000000000000000000dead");
    expect(tx.data.startsWith("0x")).toBe(true);
    expect(tx.value).toBe(BigInt(0));
  });
});

describe("transaction-builder additional cases", () => {
  it("builds swap transaction with ERC20 input (USDC -> ETH)", async () => {
    const intent: any = {
      id: "s1",
      type: "swap",
      status: "pending",
      createdAt: Date.now(),
      params: {
        fromToken: "USDC",
        toToken: "ETH",
        amount: "10",
        slippage: 1,
      },
    };

    // 这里使用动态 import 的原因是在测试中集中加载构建器函数，避免顶层循环依赖或提前解析问题。
    const txs = await (await import("../lib/web3/transaction-builder")).buildSwapTransaction(
      intent,
      // walletAddress：作为 swap 的 recipient
      "0x000000000000000000000000000000000000dEaD" as any,
      11155111
    );

    // 对 swap 的基本结构做断言：通常当输入为 ERC20 时会先生成 approve 再生成 swap
    expect(txs.length).toBe(2);
    const approve = txs[0];
    const swap = txs[1];

    // approve：类型应该是 "approve" 且 calldata 非空
    expect(approve.type).toBe("approve");
    expect(approve.data.startsWith("0x")).toBe(true);

    // swap：类型为 "swap" 且 calldata 非空；当输入为 ERC20 而非 ETH，value 应为 0
    expect(swap.type).toBe("swap");
    expect(swap.data.startsWith("0x")).toBe(true);
    expect(swap.value).toBe(BigInt(0));
  });

  it("builds supply transaction (ERC20) with approve + supply", async () => {
    const intent: any = {
      id: "sup1",
      type: "supply",
      status: "pending",
      createdAt: Date.now(),
      params: {
        token: "USDC",
        amount: "50",
        useAsCollateral: true,
      },
    };

    // Supply 场景：当存入 ERC20 时，先生成 approve，再生成 supply
    const txs = await (await import("../lib/web3/transaction-builder")).buildSupplyTransaction(
      intent,
      "0x000000000000000000000000000000000000dEaD" as any,
      11155111
    );

    // 断言 approve + supply 都被生成并且 calldata 合法
    expect(txs.length).toBe(2);
    const approve = txs.find((t) => t.type === "approve");
    const supply = txs.find((t) => t.type === "supply");
    expect(approve).toBeDefined();
    expect(approve!.data.startsWith("0x")).toBe(true);
    expect(supply).toBeDefined();
    expect(supply!.data.startsWith("0x")).toBe(true);
    // 当使用 ERC20 存入时，value 应为 0（非 ETH 情况）
    expect(supply!.value).toBe(BigInt(0));
  });

  it("builds withdraw transaction (MAX) for ERC20", async () => {
    const intent: any = {
      id: "w1",
      type: "withdraw",
      status: "pending",
      createdAt: Date.now(),
      params: {
        token: "USDC",
        amount: "MAX",
      },
    };

    // Withdraw 场景：若 amount 为 "MAX"，构建器会使用 maxUint256 表示全部提取
    const txs = await (await import("../lib/web3/transaction-builder")).buildWithdrawTransaction(
      intent,
      "0x000000000000000000000000000000000000dEaD" as any,
      11155111
    );

    // 断言：仅生成单笔 withdraw 交易，calldata 合法且 value 为 0（ERC20 withdraw）
    expect(txs.length).toBe(1);
    const tx = txs[0];
    expect(tx.type).toBe("withdraw");
    expect(tx.data.startsWith("0x")).toBe(true);
    expect(tx.value).toBe(BigInt(0));
  });
});
