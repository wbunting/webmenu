let input_stdin = "";

const stdin = process.openStdin();

stdin.on("data", (data) => {
  input_stdin += data;
});
stdin.on("end", () => {
  main();
  process.exit();
});

const main = () => {
  const obj = JSON.parse(input_stdin);
  const items =
    obj.contents.twoColumnSearchResultsRenderer.primaryContents
      .sectionListRenderer.contents[0].itemSectionRenderer.contents;
  const clean_items = items
    .filter((item) => Object.keys(item).includes("videoRenderer"))
    .map(({ videoRenderer: item }) => {
      return {
        videoUrl: `https://youtube.com/watch?v=${item.videoId}`,
        thumbnailSrc: item.thumbnail.thumbnails[0].url,
        title: item.title.runs[0].text,
        description: item.descriptionSnippet
          ? item.descriptionSnippet.runs.map((i) => i.text).join("")
          : "",
        published: item.publishedTimeText
          ? item.publishedTimeText.simpleText
          : "",
        views: item.viewCountText.simpleText,
        authorUrl: item.ownerText.runs[0].navigationEndpoint.commandMetadata.webCommandMetadata.url.split(
          "/channel/"
        )[1],
        authorName: item.ownerText.runs[0].text,
        authorIconSrc:
          item.channelThumbnailSupportedRenderers
            .channelThumbnailWithLinkRenderer.thumbnail.thumbnails[0].url,
      };
    });
  console.log(JSON.stringify(clean_items));
};
