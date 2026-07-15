export default async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {

    const {
      account,
      redirectUrl
    } = req.body;

    if (!account || !redirectUrl) {
      return res.status(400).json({
        success: false,
        error: "Missing payment details"
      });
    }

    const content = JSON.stringify({

      account: {

        bankName: account.bankName,

        accountNumber: account.accountNumber,

        accountName: account.accountName

      },

      redirectUrl: redirectUrl

    }, null, 2);


    const owner = process.env.GITHUB_OWNER;

    const repo = process.env.GITHUB_REPO;

    const token = process.env.GITHUB_TOKEN;

    const filePath = "data/payment.json";


    if (!owner || !repo || !token) {

      return res.status(500).json({

        success: false,

        error: "GitHub environment variables are missing"

      });

    }


    const githubUrl =

      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;


    /* GET CURRENT FILE */

    const currentFile = await fetch(githubUrl, {

      headers: {

        Authorization: `Bearer ${token}`,

        Accept: "application/vnd.github+json",

        "User-Agent": "markpnl-v1"

      }

    });


    if (!currentFile.ok) {

      const error = await currentFile.text();

      return res.status(currentFile.status).json({

        success: false,

        error: "Could not read payment.json",

        details: error

      });

    }


    const currentData = await currentFile.json();


    /* UPDATE FILE */

    const updateFile = await fetch(githubUrl, {

      method: "PUT",

      headers: {

        Authorization: `Bearer ${token}`,

        Accept: "application/vnd.github+json",

        "Content-Type": "application/json",

        "User-Agent": "markpnl-v1"

      },

      body: JSON.stringify({

        message: "Update Nextel V1 payment details",

        content: Buffer
          .from(content)
          .toString("base64"),

        sha: currentData.sha

      })

    });


    const result = await updateFile.json();


    if (!updateFile.ok) {

      return res.status(updateFile.status).json({

        success: false,

        error: "Failed to update payment details",

        details: result

      });

    }


    return res.status(200).json({

      success: true,

      message: "Payment details updated successfully"

    });


  } catch (error) {

    console.error(error);

    return res.status(500).json({

      success: false,

      error: "Server error"

    });

  }

}
