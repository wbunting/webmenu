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
      case "q": {
        // kill the application
        invoke({
          cmd: "exit",
        });
        break;
      }
      case "1": {
        const output = [...document.querySelectorAll("li")][0].getAttribute(
          "output"
        );
        invoke({
          cmd: "sendToStandardOutAndExit",
          output,
        });
        break;
      }
      case "2": {
        const output = [...document.querySelectorAll("li")][1].getAttribute(
          "output"
        );
        invoke({
          cmd: "sendToStandardOutAndExit",
          output,
        });
        break;
      }
      case "3": {
        const output = [...document.querySelectorAll("li")][2].getAttribute(
          "output"
        );
        invoke({
          cmd: "sendToStandardOutAndExit",
          output,
        });
        break;
      }
      case "4": {
        const output = [...document.querySelectorAll("li")][3].getAttribute(
          "output"
        );
        invoke({
          cmd: "sendToStandardOutAndExit",
          output,
        });
        break;
      }
      case "5": {
        const output = [...document.querySelectorAll("li")][4].getAttribute(
          "output"
        );
        invoke({
          cmd: "sendToStandardOutAndExit",
          output,
        });
        break;
      }
      case "6": {
        const output = [...document.querySelectorAll("li")][5].getAttribute(
          "output"
        );
        invoke({
          cmd: "sendToStandardOutAndExit",
          output,
        });
        break;
      }
      case "7": {
        const output = [...document.querySelectorAll("li")][6].getAttribute(
          "output"
        );
        invoke({
          cmd: "sendToStandardOutAndExit",
          output,
        });
        break;
      }
      case "8": {
        const output = [...document.querySelectorAll("li")][7].getAttribute(
          "output"
        );
        invoke({
          cmd: "sendToStandardOutAndExit",
          output,
        });
        break;
      }
      case "9": {
        const output = [...document.querySelectorAll("li")][8].getAttribute(
          "output"
        );
        invoke({
          cmd: "sendToStandardOutAndExit",
          output,
        });
        break;
      }
      case "0": {
        const output = [...document.querySelectorAll("li")][9].getAttribute(
          "output"
        );
        invoke({
          cmd: "sendToStandardOutAndExit",
          output,
        });
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
