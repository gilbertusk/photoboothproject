declare module 'midtrans-client' {
  interface Config {
    isProduction: boolean;
    serverKey: string;
    clientKey: string;
  }

  interface TransactionAction {
    name: string;
    method: string;
    url: string;
  }

  interface ChargeResponse {
    status_code: string;
    status_message: string;
    transaction_id: string;
    order_id: string;
    gross_amount: string;
    payment_type: string;
    transaction_time: string;
    transaction_status: string;
    fraud_status?: string;
    actions?: TransactionAction[];
    [key: string]: any;
  }

  interface StatusResponse {
    status_code: string;
    status_message: string;
    transaction_id: string;
    order_id: string;
    gross_amount: string;
    payment_type: string;
    transaction_time: string;
    transaction_status: string;
    fraud_status?: string;
    [key: string]: any;
  }

  class CoreApi {
    constructor(config: Config);
    charge(parameter: any): Promise<ChargeResponse>;
    transaction: {
      status(transactionIdOrOrderId: string): Promise<StatusResponse>;
      cancel(transactionIdOrOrderId: string): Promise<StatusResponse>;
      expire(transactionIdOrOrderId: string): Promise<StatusResponse>;
    };
  }

  class Snap {
    constructor(config: Config);
    createTransaction(parameter: any): Promise<any>;
    createTransactionToken(parameter: any): Promise<string>;
    createTransactionRedirectUrl(parameter: any): Promise<string>;
  }
}
