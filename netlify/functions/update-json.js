exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { newContent } = JSON.parse(event.body);

  const GITHUB_TOKEN = process.env.MY_GITHUB_TOKEN;
  const REPO_OWNER = "herczegAkos25"; 
  const REPO_NAME = "mit_sutsz_kis_szucs";  
  const FILE_PATH = ".\\receptek.json";         

  const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;

  try {
    const getFileResponse = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}` }
    });
    const fileData = await getFileResponse.json();

    const updatedContentBase64 = Buffer.from(JSON.stringify(newContent, null, 2)).toString('base64');

    const updateResponse = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "új recept",
        content: updatedContentBase64,
        sha: fileData.sha 
      })
    });

    if (!updateResponse.ok) {
      throw new Error("GitHub API hiba");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Sikeres mentés és commit!" })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};