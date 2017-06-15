export default function throttle(func, threshold) {
    clearTimeout(func.tId)
    func.tId = setTimeout(func, threshold || 200)
}