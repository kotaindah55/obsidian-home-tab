import { appendFileSync, existsSync, rmSync } from "fs";
import process from "process";
import * as sass from "sass";

const prod = (process.argv[2] === "production");

const compiled = sass.compile(
	"styles/styles.scss",
	{ style: prod ? "compressed" : "expanded" }
);

const targetPath = prod ? "styles.css" : "dist/styles.css";

if (existsSync(targetPath)) rmSync("styles.css");

appendFileSync(targetPath, compiled.css);