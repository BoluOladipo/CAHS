export function assertNonNegativeCapacity(available, requested) {
    if (requested > available) {
        throw new Error("Storage capacity cannot go negative. Requested quantity exceeds available capacity.");
    }
}
export function runningBalance(intake, dispatch) {
    const balance = intake - dispatch;
    if (balance < -0.0001) {
        throw new Error("Stock ledger does not reconcile: dispatch exceeds intake.");
    }
    return Math.round(balance * 1000) / 1000;
}
