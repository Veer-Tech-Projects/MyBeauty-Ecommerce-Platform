export function getFullImageUrl(relativePath, folder = "") {
  if (!relativePath) return "/placeholder.png"; // fallback image

  return `http://localhost:5000/static/${folder}/${relativePath}`;
}
