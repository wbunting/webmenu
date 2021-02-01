<script>
  import { getMatches } from "tauri/api/cli";
  import { onMount } from "svelte";
  import cx from "classnames";
  import { invoke } from "tauri/api/tauri";
  let selectedOption = 0;
  let data = null;
  let splitdata = [];
  let main = null;

  function isElementInViewport(el) {
    let rect = el.getBoundingClientRect();

    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  const updateData = () => {
    splitdata = data.split("<li");
    splitdata.shift();
    main.innerHTML = splitdata
      .map((s, i) => {
        return `<div class="${cx("", {
          "bg-gray-600": i === selectedOption,
        })}"><li${s}</div>`;
      })
      .join("");
    [...document.getElementsByTagName("li")].forEach((e) => {
      const originalClass = e.getAttribute("class");
      e.setAttribute("class", cx(originalClass, "list-none"));
    });
  };

  onMount(async () => {
    const matches = await getMatches();
    data = matches.args.source.value;
    updateData();
  });

  const handleKeydown = (e) => {
    switch (e.key) {
      case "j": {
        if (selectedOption < splitdata.length - 1) {
          selectedOption += 1;
          updateData();
          let thisLi = document.querySelectorAll("li")[selectedOption];
          if (!isElementInViewport(thisLi)) {
            thisLi.scrollIntoView();
          }
        }
        break;
      }
      case "k": {
        if (selectedOption > 0) {
          selectedOption -= 1;
          updateData();
          let thisLi = document.querySelectorAll("li")[selectedOption];
          if (!isElementInViewport(thisLi)) {
            thisLi.scrollIntoView();
          }
        }
        break;
      }
      case "Enter": {
        // find the li that is selected and get it's output attribute
        const output = [...document.querySelectorAll("li")][
          selectedOption
        ].getAttribute("output");

        invoke({
          cmd: "sendToStandardOutAndExit",
          output,
        });
        break;
      }
      default:
        break;
    }
  };
</script>

<style global lang="postcss">
  body {
    padding: 0px;
    margin: 0px;
  }

  @tailwind base;
  @tailwind components;
  @tailwind utilities;
</style>

<svelte:window on:keydown={handleKeydown} />

<main class="overflow-y-scroll" bind:this={main} />
