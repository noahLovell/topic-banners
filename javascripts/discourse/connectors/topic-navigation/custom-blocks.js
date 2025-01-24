import Component from "@glimmer/component";
import { htmlSafe } from "@ember/template";
import { action } from "@ember/object";
import { getOwner } from "@ember/application";
import { ajax } from "discourse/lib/ajax";
import { sendEmail } from "discourse/lib/email";

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
  handleBlockClick(block, event) {
     
    const apiEndpoint = settings.api_endpoint;

    if (!apiEndpoint) {
      console.warn("API endpoint is not configured.");
      return;
    }

    const payload = {
      placementID: block.placementID,
      campaignID: block.campaignID
    };

    // Send the API data
    ajax(apiEndpoint, {
      method: "POST",
      data: payload,
      headers: {
        "Content-Type": "application/json",
        "referrer": document.referrer
      },
    })
      .then((response) => {
        console.log("Block data sent successfully:", response);
        const href = event.target.getAttribute('href'); 
        if (href) {
          const router = getOwner(this).lookup("router:main");
          const url = new URL(href);
          const path = url.pathname + url.search;
          router.transitionTo(path);
        }
      })
      .catch((error) => {
        console.error("Error sending block data:", error);
        const emails = settings.error_notification_emails
          ? settings.error_notification_emails.split(",").map((e) => e.trim())
          : [];

        if (emails.length > 0) {
          const emailBody = `
            An error occurred during an API request:
            
            Error Message: ${error.message}
            API Endpoint: ${apiEndpoint}
            Origin: ${window.location.origin}
            Referrer: ${document.referrer || "N/A"}
            Placement ID: ${placementID || "N/A"}
            Campaign ID: ${campaignID || "N/A"}
          `;
          emails.forEach((email) => {
            sendEmail({
              to: email,
              subject: "Topic Banner Plugin API Error Occured",
              body: emailBody,
            });
          });
        }
      });
  }
}

