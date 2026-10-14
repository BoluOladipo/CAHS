export function formatNaira(amount) {
    const formatted = new Intl.NumberFormat("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
    return `₦${formatted}`;
}
export function roundMoney(amount) {
    return Math.round((amount + Number.EPSILON) * 100) / 100;
}
