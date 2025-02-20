import {
    TariProvider,
    TransactionStatus,
    Account,
    SubstateRequirement,
    TransactionBuilder,
    Amount,
    buildTransactionRequest,
} from "@tari-project/tarijs";

const network: number = import.meta.env.VITE_NETWORK ? parseInt(import.meta.env.VITE_NETWORK) : 0x10;

export async function getSubstate<T extends TariProvider>(
    provider: T,
    substateId: string
) {
    const resp = await provider.getSubstate(substateId);
    return resp;
}

export interface SubmitTransactionProps {
    provider: TariProvider;
    account: Account;
    builder: TransactionBuilder;
    requiredSubstates: SubstateRequirement[];
}

export async function submitTransactionAndWaitForResult(
    props: SubmitTransactionProps
) {
    const {provider, account, builder, requiredSubstates} = props;
    const fee = new Amount(2000);
    const transaction = builder
        .feeTransactionPayFromComponent(account.address, fee.getStringValue())
        .build();
    const submitTransactionRequest = buildTransactionRequest(
        transaction,
        account.account_id,
        requiredSubstates,
        undefined,
        undefined,
        network
    );
    const resp = await provider.submitTransaction(submitTransactionRequest);
    const result = await waitForTransactionResult(provider, resp.transaction_id);
    return result;
}

export async function waitForTransactionResult(
    provider: TariProvider,
    transactionId: string
) {
    while (true) {
        const resp = await provider.getTransactionResult(transactionId);
        const FINALIZED_STATUSES = [
            TransactionStatus.Accepted,
            TransactionStatus.Rejected,
            TransactionStatus.InvalidTransaction,
            TransactionStatus.OnlyFeeAccepted,
            TransactionStatus.DryRun,
        ];

        if (resp.status == TransactionStatus.Rejected) {
            throw new Error(`Transaction rejected: ${JSON.stringify(resp.result)}`);
        }

        if (FINALIZED_STATUSES.includes(resp.status)) {
            return resp;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
}
