import * as net from "net";
import * as path from "path";
import * as fs from "fs/promises";

const WEB = "web";
const PORT = 8080;

// CIA ATSAKO NARSYKLE SERVERIUI
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
          return;
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

// CIA ATSAKO SERVERIS NARSYKLEI
async function handler(socket) {
  let data;
  try {
    //1. SKAITOMI HEAEDERIAI
    data = await readHeaders(socket);
    // 2. Pasiimu pirma eilute
    const lines = data.split("\r\n");
    // 3. Pasiimu tik resurso pavadinima
    let [, resource] = lines[0].split(" ");
    // 4. Susirandu failo pavadinima WEB faile
    const f = path.join(WEB, resource);
    // 5. Perskaitau faila
    let res = "";
    try {
      // NAUDOJANT FUNKCIJA STAT PATIKRINAM AR YRA REIKIAMAS FAILAS
      const stat = await fs.stat(f);
      if (stat.isFile()) {
        const response = await fs.readFile(f, {
          encoding: "utf8",
        });
        //6. Jeigu toki faila radau siunsiu atsakyma 200 su jo turiniu
        res += "HTTP/1.1 200 OK\r\n";
        res += "\r\n";
        res += response;
        // CIA TIKRINAM su STAT AR TAI YRA DIREKTORIJA
        //jeigu direktorija - tada turime atspausdinti viska kas ten yra (readdir), reiskias turime parasyti html patys / DINAMINIS HTML SUGENERAVIMAS
      } else if (stat.isDirectory()) {
        const files = await fs.readdir(f);
        // Jeigu nesibaigia / sleshu
        resource += (!resource.endsWith("/")) ? "/" : "";
        res += "HTTP/1.1 200 OK\r\n";
        res += "\r\n";
        res += `<html>\r\n`;
        res += `<body>\r\n`;
        res += `Direktorija ${resource}<br>\r\n`;
        if (resource != "/") {
          res += `<a href="${resource + ".."}">..</a><br>\r\n`;
        }
        res += `<ul>\r\n`;
        for (const fileName of files) {
          res += `<li><a href="${resource + fileName}">${fileName}</a></li>`;
        }
        res += "</ul></body></html>";
      } else {
        //7. Jeigu tokio failo neradau siunsiu atsakyma 404
        res += "HTTP/1.1 400 Bad Request\r\n";
        res += "\r\n";
      }
    } catch (err) {
      res += "HTTP/1.1 404 Not Found\r\n";
      res += "\r\n";
    }
    socket.write(res, "utf8");
  } catch (err) {
    console.log(data);
    console.log("Klaida", err);
    let res = "HTTP/1.1 400 Bad Request\r\n";
    res += "\r\n";
    socket.write(res, "utf8");
  } finally {
    socket.end();
    //8. VISADA PRIVALOMA UZDARYTI SOCKET
  }
}

const srv = net.createServer(handler);

srv.listen(PORT);
console.log("Server started");
