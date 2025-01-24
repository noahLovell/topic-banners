import Component from "@glimmer/component";
import { htmlSafe } from "@ember/template";
import { action } from "@ember/object";
import { getOwner } from "@ember/application";
import { ajax } from "discourse/lib/ajax";
import { inject as service } from "@ember/service";

export default class CustomBlocks extends Component {
  @service siteSettings;

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
        this.sendErrorEmail({
          origin: window.location.origin,
          placementID: block.placementID ? block.placementID : "none provided",
          campaignID: block.campaignID ? block.campaignID : "none provided",
          message: error.message,
        });
      }
    );
  }

  sendErrorEmail({ origin, placementID, campaignID, message }) {
    const emailAddresses = settings.error_notification_emails || "";
    const recipients = emailAddresses.split(",").map((email) => email.trim()).filter(Boolean);

    if (recipients.length === 0) {
      console.warn("No email recipients configured for error notifications.");
      return;
    }

    recipients.forEach((email) => {
      ajax("/admin/email", {
        method: "POST",
        data: {
          to: email,
          subject: "Topic Banners API Error",
          body: `
            An API error occurred.

            **Error Details**:
            Origin: ${origin}
            Placement ID: ${placementID}
            Campaign ID: ${campaignID}
            Error Message: ${message}
          `,
        },
      })
        .then(() => console.log(`Error notification sent to ${email}`))
        .catch((err) => console.error(`Failed to send email to ${email}:`, err));
    });
  }
}
