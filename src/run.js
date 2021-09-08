import * as net from "net";
import * as path from "path";
import * as fs from "fs/promises";

const WEB = "web";
const PORT = 3000;

function readHeaders(socket) {
  return new Promise((resolve, reject) => {
    let res = "";
    socket.setEncoding("utf8");
    socket.on("data", (data) => {
      res += data;
      const lines = data.split("\r\n");
      for (const line of lines) {
        if (line === "") {
          resolve(res);
          return
        }
      }
    });
    socket.on("end", () => {
      resolve(res);
    });
    socket.on("error", (err) => {
      reject(err);
    });
  });
}

async function handler(socket) {
  try {
    const data = await readHeaders(socket);
    // console.log(data);
    const lines = data.split("\r\n");
    // console.log(lines[0]);
    const [, resource] = lines[0].split(" ");
    // console.log(resource);
    const f = path.join(WEB, resource);
    // console.log(f);
  
    let res = "";
    try {
      const response = await fs.readFile(f, {
        encoding: "utf8"
      });
      res += "HTTP/1.1 200 OK\r\n";
      res += "\r\n";
      res += response;
    } catch (err) {
      res += "HTTP/1.1 404 Not Found\r\n";
      res += "\r\n";
    }
    // console.log(res);
  
    // let res = "HTTP/1.1 404 Not found\r\n";
    // res += "<html>\r\n";
    // res += "<body>\r\n";
    // res += "<h1>Hello World</h1>\r\n";
    // res += "</body>\r\n";
    // res += "</html>\r\n";
    socket.write(res, "utf8");
  } catch (err) {
    console.log("Klaida", err);
    let res = "HTTP/1.1 400 Bad Request\r\n";
    res += "\r\n";
    socket.write(res, "utf8");
} finally {
    socket.end();
  }
}

const srv = net.createServer(handler);

srv.listen(PORT);
console.log("Server started");

