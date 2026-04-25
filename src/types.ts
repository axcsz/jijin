export type TransactionAction = '买入' | '卖出' | '分红';

export interface Account {
  id: string;
  name: string;
}

export interface Transaction {
  id: string;
  accountId: string;    // 所属账户ID
  date: string;         // 日期
  fundCode: string;     // 基金代码
  fundName: string;     // 基金名称
  action: TransactionAction; // 操作
  amount: number;       // 金额
  nav: number;          // 成交净值
  shares: number;       // 份额
  isDividend: string;   // 是否分红
  cashFlow: number;     // 现金流
}

export interface FundHolding {
  fundCode: string;     // 基金代码
  fundName: string;     // 基金名称
  totalInvested: number;// 累计投入
  totalSold: number;    // 累计卖出
  dividendReinvested: number; // 分红再投
  holdingShares: number;// 持有份额
  currentNav: number | null; // 当前净值
  currentMarketValue: number; // 当前市值
  costNav: number;      // 成本净值
  unrealizedProfit: number; // 未实现收益
  yieldRate: number;    // 收益率
}
