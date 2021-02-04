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
      ({ abstract, title, url }) => `<li output="${url}">
          <div class="flex flex-col my-2 mx-4">
            <h2 class="font-bold text-lg color-grey-300">${title}</h2>
            <p class="text-xs font-mono text-green-400">${url}</p>
            <p class="text-sm">${abstract}</p>
          </div>
        </li>`
    )
    .join("");
  console.log(html);
};
