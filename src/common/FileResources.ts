import {join} from "path";

export class FileResources {

	public static readonly INDEX = join(__dirname, "../index.html");

	public static readonly NODE_MODULES_PATH = join(__dirname, "../node_modules");

	public static readonly PACKAGE = join(__dirname, "../../", "package.json");

	public static readonly RESOURCES_PATH = join(__dirname, "/../resources");

}
