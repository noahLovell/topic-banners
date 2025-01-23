import Component from "@glimmer/component";
import { htmlSafe } from "@ember/template";
import { action } from "@ember/object";
import { getOwner } from "@ember/application";
import { ajax } from "discourse/lib/ajax";

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
      .map((block) => {
        return {
          content: htmlSafe(block.html),
          placementID: block.placementID,
          campaignID: block.campaignID,
        };
      });
  }


@action
  handleBlockClick(event, placementID, campaignID) {
    event.preventDefault(); 

    const apiEndpoint = settings.custom_api_endpoint;

    if (!apiEndpoint) {
      console.warn("API endpoint is not configured.");
      return;
    }

    const payload = {
      placementID,
      campaignID
    };

    // Send the API data
    ajax(apiEndpoint, {
      method: "POST",
      data: payload,
      headers: {
        "Content-Type": "application/json",
        "origin": window.location.origin,
        "referrer": document.referrer
      },
    })
      .then((response) => {
        console.log("Block data sent successfully:", response);

        // After successful API call, navigate using Ember router
        const href = event.target.getAttribute('href'); // Access href safely
        if (href) {
          const router = getOwner(this).lookup("router:main");
          const url = new URL(href);
          const path = url.pathname + url.search;
          router.transitionTo(path);
        }
      })
      .catch((error) => {
        console.error("Error sending block data:", error);
      });
  }
}

