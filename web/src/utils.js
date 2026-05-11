export const PAGE_SIZE = 12;
export const passwordStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8)
        score++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd))
        score++;
    if (/\d/.test(pwd))
        score++;
    if (/[^A-Za-z0-9]/.test(pwd))
        score++;
    if (score <= 1)
        return { label: "弱", color: "#dc2626", pass: false };
    if (score <= 2)
        return { label: "中", color: "#f59e0b", pass: true };
    return { label: "强", color: "#16a34a", pass: true };
};
const MAX_IMAGE_WIDTH = 800;
const MAX_IMAGE_HEIGHT = 800;
const IMAGE_QUALITY = 0.7;
export const toBase64 = (file) => new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
        img.src = String(e.target?.result || "");
    };
    img.onload = () => {
        let { width, height } = img;
        if (width > MAX_IMAGE_WIDTH || height > MAX_IMAGE_HEIGHT) {
            const ratio = Math.min(MAX_IMAGE_WIDTH / width, MAX_IMAGE_HEIGHT / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            reject(new Error("无法创建画布"));
            return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const base64 = canvas.toDataURL("image/jpeg", IMAGE_QUALITY);
        resolve(base64);
    };
    img.onerror = () => reject(new Error("图片加载失败"));
    reader.onerror = () => reject(new Error("读取图片失败"));
    reader.readAsDataURL(file);
});
export const distanceKm = (a, b) => {
    if (typeof b.latitude !== "number" || typeof b.longitude !== "number")
        return Number.POSITIVE_INFINITY;
    const toRad = (x) => (x * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(b.latitude - a.latitude);
    const dLon = toRad(b.longitude - a.longitude);
    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);
    const h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
};
