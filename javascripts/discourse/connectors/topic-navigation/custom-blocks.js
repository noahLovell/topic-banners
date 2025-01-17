import Component from "@glimmer/component";
import { htmlSafe } from "@ember/template";

export default class CustomBlocks extends Component {
  get blocksToDisplay() {
    const tags = this.args.outletArgs?.topic?.tags || [];
    let blocks = [];

    try {
      // First parse the outer JSON structure
      console.log("Settings:", settings);
      console.log("Settings blocks:", settings.blocks);
      if (typeof settings.blocks === "string") {
        // Parse the string (if JSON-encoded)
        blocks = JSON.parse(settings.blocks || "[]");
      } else if (Array.isArray(settings.blocks)) {
        // Use directly if it's already an array/object
        blocks = settings.blocks;
      }
    } catch (e) {
      console.error("Error parsing theme settings for 'blocks':", e);
    }

    console.log("Parsed blocks:", blocks);
    console.log("Topic tags:", tags);

    return blocks
      .filter((block) => block.tags?.some((tag) => tags.includes(tag)))
      .map((block) => ({
        content: htmlSafe(block.html),
      }));
  }
}
