export const getOriginalFilename = (fullPath) => {
  // Decode URL encoded filename
  const decodedPath = decodeURIComponent(fullPath);
  const filename = decodedPath.split("/").pop(); // Get filename from path
  const extension = filename.substring(filename.lastIndexOf(".")); // Get extension
  return (
    decodeURIComponent(filename.split("-").slice(0, -2).join("-")) + extension
  );
};
