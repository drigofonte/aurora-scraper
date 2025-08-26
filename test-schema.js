import { defaultSchemaRegistry, initializeSchemas } from "./dist/schemas/index.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testSchemaLoading() {
  console.log("🧪 Testing schema loading...");

  try {
    // Test loading schemas
    const schemaDir = join(__dirname, "src", "schemas");
    await defaultSchemaRegistry.loadSchemasFromDirectory(schemaDir);

    console.log("✅ Schemas loaded successfully");
    console.log("📋 Available schemas:", defaultSchemaRegistry.getSchemaNames());
    console.log("📄 Has article schema:", defaultSchemaRegistry.hasSchema("article"));
    console.log("📄 Has event schema:", defaultSchemaRegistry.hasSchema("event"));

    // Test schema validation
    const articleSchema = defaultSchemaRegistry.getSchema("article");
    if (articleSchema) {
      const testData = {
        title: "Test Article",
        content: "This is test content for the article.",
        category: "Test",
      };

      const isValid = articleSchema(testData);
      console.log("✅ Article validation test:", isValid ? "PASSED" : "FAILED");
      if (!isValid && articleSchema.errors) {
        console.log("❌ Validation errors:", articleSchema.errors);
      }
    }
  } catch (error) {
    console.error("❌ Schema loading failed:", error);
  }
}

testSchemaLoading();
