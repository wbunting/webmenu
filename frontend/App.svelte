<script>
  import { onMount } from "svelte";
  import cx from "classnames";
  let selectedOption = 0;
  let data = null;
  let fzf = "";
  let placeholder = "Search";
  let splitdata = [];
  let main = null;
  let showfzf = false;
  let host = "http://localhost:12395";

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

  const handleClick = (output) => {
	  fetch(`${host}/write`, {method: 'POST', body: JSON.stringify({output})});
  };

  const updateData = () => {
    splitdata = data.split("<li");
    splitdata.shift();

    main.innerHTML = splitdata
      .filter((s) => {
        if (showfzf && Boolean(fzf)) {
          return s.includes(fzf);
        }
        return true;
      })
      .map((s, i) => {
        return `<div class="${cx("", {
          "bg-gray-600": i === selectedOption,
        })}"><li${s}</div>`;
      })
      .join("");

    [...document.getElementsByTagName("li")].forEach((e) => {
      e.addEventListener("click", () => handleClick(e.getAttribute("output")));
      const originalClass = e.getAttribute("class");
      e.setAttribute("class", cx(originalClass, "list-none"));
    });
  };

  const init = (el) => {
    el.focus();
  };

   onMount(async () => {
      const res = await fetch(`${host}/init`);
      const matches = await res.json();

      data = matches.input;

    if (Boolean(matches.placeholder)) {
        showfzf = true;
        placeholder = matches.placeholder;
    }

    updateData();
  });

  const handleSearch = () => {
    updateData();
  };

  const handleKeydown = (e) => {
    switch (e.key) {
      case "j": {
        if (!showfzf) {
          if (selectedOption < splitdata.length - 1) {
            selectedOption += 1;
            updateData();
            let thisLi = document.querySelectorAll("li")[selectedOption];
            if (!isElementInViewport(thisLi)) {
              thisLi.scrollIntoView();
            }
          }
        }
        break;
      }
      case "ArrowDown": {
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
        if (!showfzf) {
          if (selectedOption > 0) {
            selectedOption -= 1;
            updateData();
            let thisLi = document.querySelectorAll("li")[selectedOption];
            if (!isElementInViewport(thisLi)) {
              thisLi.scrollIntoView();
            }
          }
        }
        break;
      }
      case "ArrowUp": {
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
        if (!showfzf) {
          external.invoke('exit');
        }
        break;
      }
      case "1": {
        const output = [...document.querySelectorAll("li")][0].getAttribute(
          "output"
        );
        fetch(`${host}/write`, {method: "POST", body: JSON.stringify({output})});
        break;
      }
      case "2": {
        const output = [...document.querySelectorAll("li")][1].getAttribute(
          "output"
        );
        fetch(`${host}/write`, {method: "POST", body: JSON.stringify({output})});
        break;
      }
      case "3": {
        const output = [...document.querySelectorAll("li")][2].getAttribute(
          "output"
        );
        fetch(`${host}/write`, {method: "POST", body: JSON.stringify({output})});
        break;
      }
      case "4": {
        const output = [...document.querySelectorAll("li")][3].getAttribute(
          "output"
        );
        fetch(`${host}/write`, {method: "POST", body: JSON.stringify({output})});
        break;
      }
      case "5": {
        const output = [...document.querySelectorAll("li")][4].getAttribute(
          "output"
        );
        fetch(`${host}/write`, {method: "POST", body: JSON.stringify({output})});
        break;
      }
      case "6": {
        const output = [...document.querySelectorAll("li")][5].getAttribute(
          "output"
        );
        fetch(`${host}/write`, {method: "POST", body: JSON.stringify({output})});
        break;
      }
      case "7": {
        const output = [...document.querySelectorAll("li")][6].getAttribute(
          "output"
        );
        fetch(`${host}/write`, {method: "POST", body: JSON.stringify({output})});
        break;
      }
      case "8": {
        const output = [...document.querySelectorAll("li")][7].getAttribute(
          "output"
        );
        fetch(`${host}/write`, {method: "POST", body: JSON.stringify({output})});
        break;
      }
      case "9": {
        const output = [...document.querySelectorAll("li")][8].getAttribute(
          "output"
        );
        fetch(`${host}/write`, {method: "POST", body: JSON.stringify({output})});
        break;
      }
      case "0": {
        const output = [...document.querySelectorAll("li")][9].getAttribute(
          "output"
        );
        fetch(`${host}/write`, {method: "POST", body: JSON.stringify({output})});
        break;
      }
      case "Enter": {
        // find the li that is selected and get it's output attribute
        const output = [...document.querySelectorAll("li")][
          selectedOption
	].getAttribute("output");

	fetch(`${host}/write`, {method: "POST", headers: {
            "Content-Type": "application/json"
	}, body: JSON.stringify({output})});
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
{#if showfzf}
  <input
    class="border py-2 px-3 w-full text-gray-900"
    {placeholder}
    bind:value={fzf}
    use:init
    on:input={handleSearch} />
{/if}
<main class="overflow-y-scroll" bind:this={main} />
