const urlStr = 'http://backend:8888/api/users/login/'.replace(/(?<!:)\/+/g, "/");
console.log("String result:", urlStr);
try {
  const url = new URL(urlStr);
  console.log("URL is valid:", url.toString());
} catch(e) {
  console.log("URL is invalid:", e.message);
}
