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
  const jsonData = JSON.parse(input_stdin);
  const html = jsonData
    .map(
      ({
        videoUrl,
        title,
        thumbnailSrc,
        description,
        published,
        authorName,
        authorIconSrc,
      }) => `<li output="${videoUrl}">
          <div class="flex my-2 mx-4">
            <img class="mr-4 w-48 h-32 object-contain" src="${thumbnailSrc}" /> 
            <div>
            <h2 class="font-bold text-lg color-grey-300">${title}</h2>
            <p>${published}</p>
            <div class="flex">
              <img class="h-6 w-6 rounded-full mr-3" src="${authorIconSrc}"/>
              <span class="text-gray-400">${authorName}</span>
            </div>
            <p class="text-sm">${description}</p>
          </div>
          </div>
        </li>`
    )
    .join("");
  console.log(html);
};
