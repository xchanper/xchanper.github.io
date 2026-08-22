---
title: 旅行地图
date: 1970-01-01
travelGallery:
  - city: 赤峰市
    time: 2026.07
    image: /img/游记/赤峰.jpg
  - city: 张家口市
    time: 2026.07
    image: /img/游记/张家口.jpg
  - city: 迪庆藏族自治州
    time: 2026.06
    image: /img/游记/迪庆.jpg
  - city: 亳州市
    time: 2026.05
    image: /img/游记/亳州.jpg
  - city: 大理白族自治州
    time: 2026.04
    image: /img/游记/大理.jpeg
  - city: 丽江市
    time: 2026.04
    image: /img/游记/丽江.jpeg
  - city: 衡阳市
    time: 2026.02
    image: /img/游记/衡阳.jpg
  - city: 澳门特别行政区
    time: 2026.01
    image: /img/游记/澳门.jpg
  - city: 珠海市
    time: 2026.01
    image: /img/游记/珠海.jpg
  - city: 香港特别行政区
    time: 2025.12
    image: /img/游记/香港.jpg
  - city: 深圳市
    time: 2025.12
    image: /img/游记/深圳.jpg
  - city: 新疆维吾尔自治区
    time: 2025.10
    image: /img/游记/新疆.jpg
  - city: 青岛市
    time: 2025.07
    image: /img/游记/青岛.jpg
  - city: 廊坊市
    time: 2025.06
    image: /img/游记/廊坊.jpg
  - city: 阿坝藏族羌族自治州
    time: 2025.05
    image: /img/游记/阿坝.jpg
  - city: 成都市
    time: 2025.05
    image: /img/游记/成都.jpg
  - city: 保定市
    time: 2025.04
    image: /img/游记/保定.jpg
  - city: 三亚市
    time: 2025.02
    image: /img/游记/三亚.jpg
  - city: 海口市
    time: 2025.02
    image: /img/游记/海口.jpg
  - city: 哈尔滨市
    time: 2025.02
    image: /img/游记/哈尔滨.jpg
  - city: 大连市
    time: 2024.10
    image: /img/游记/大连.jpg
  - city: 烟台市
    time: 2024.10
    image: /img/游记/烟台.jpg
  - city: 威海市
    time: 2024.09
    image: /img/游记/威海.jpg
  - city: 秦皇岛
    time: 2024.09
    image: /img/游记/秦皇岛.jpg
  - city: 兰州市
    time: 2024.06
    image: /img/游记/兰州.jpg
  - city: 那曲市
    time: 2024.06
    image: /img/游记/那曲.jpg
  - city: 日喀则市
    time: 2024.06
    image: /img/游记/日喀则.jpg
  - city: 山南市
    time: 2024.06
    image: /img/游记/山南.jpg
  - city: 林芝市
    time: 2024.06
    image: /img/游记/林芝.jpg
  - city: 拉萨市
    time: 2024.06
    image: /img/游记/拉萨.jpg
  - city: 西宁市
    time: 2024.06
    image: /img/游记/西宁.jpg
  - city: 萍乡市
    time: 2024.05
    image: /img/游记/萍乡.jpg
  - city: 西安市
    time: 2024.04
    image: /img/游记/西安.jpg
  - city: 湘潭市
    time: 2024.04
    image: /img/游记/湘潭.jpg
  - city: 泰安市
    time: 2024.02
    image: /img/游记/泰安.jpg
  - city: 济南市
    time: 2024.02
    image: /img/游记/济南.jpg
  - city: 苏州市
    time: 2024.02
    image: /img/游记/苏州.jpg
  - city: 南昌市
    time: 2024.02
    image: /img/游记/南昌.jpg
  - city: 武汉市
    time: 2024.01
    image: /img/游记/武汉.jpg
  - city: 盐城市
    time: 2024.01
    image: /img/游记/盐城.jpg
  - city: 广州市
    time: 2023.10
    image: /img/游记/广州.jpg
  - city: 天津市
    time: 2023.09
    image: /img/游记/天津.jpg
  - city: 张家界市
    time: 2023.05
    image: /img/游记/张家界.jpg
  - city: 长沙市
    time: 2021.09
    image: /img/游记/长沙.jpg
  - city: 北京市
    time: 2019.05
    image: /img/游记/北京.jpg
  - city: 南京市
    time: 2017.09
    image: /img/游记/南京.jpg
  - city: 黄山市
    time: 2017.07
    image: /img/游记/黄山.jpg
  - city: 杭州市
    time: 2014.06
    image: /img/游记/杭州.jpg
  - city: 上海市
    time: Grow
    image: /img/游记/上海.jpg
  - city: 阜宁县
    time: Home
    image: /img/游记/阜宁.jpg
---
用地图记录走过的城市。浅蓝色区域是已经点亮的地方，后面继续慢慢补全。

<div class="travel-map-embed">
  <div id="travel-map-container"></div>
</div>

<style>
  .travel-map-embed {
    overflow: hidden;
    border: 1px solid rgba(29, 37, 36, .12);
    border-radius: .5rem;
    background: #fffdf8;
    box-shadow: 0 24px 80px rgba(24, 31, 30, .10);
  }

  #travel-map-container {
    width: 100%;
    min-height: 72vh;
  }

  .travel-gallery-header {
    display: flex;
    align-items: baseline;
    gap: 1rem;
    margin: 3rem 0 1.2rem;
  }

  .travel-gallery-header h2 {
    margin: 0;
    font-size: clamp(1.4rem, 3vw, 2rem);
  }

  .travel-gallery-header span {
    color: var(--muted);
    font-size: .9rem;
  }

  .travel-gallery {
    columns: 3;
    column-gap: .75rem;
  }

  @media (max-width: 680px) {
    .travel-gallery { columns: 2; }
  }

  .travel-card {
    position: relative;
    break-inside: avoid;
    margin-bottom: .75rem;
    border-radius: .4rem;
    overflow: hidden;
    cursor: zoom-in;
  }

  .travel-card img {
    display: block;
    width: 100%;
    height: auto;
    border-radius: .4rem;
    border: none;
    margin: 0;
    transition: transform .3s ease, filter .3s ease;
  }

  .travel-card:hover img {
    transform: scale(1.04);
    filter: brightness(.72);
  }

  .travel-card-label {
    position: absolute;
    inset: auto 0 0;
    padding: 1.6rem .75rem .65rem;
    background: linear-gradient(to top, rgba(0,0,0,.62) 0%, transparent 100%);
    opacity: 0;
    transition: opacity .25s ease;
    pointer-events: none;
  }

  .travel-card:hover .travel-card-label {
    opacity: 1;
  }

  .travel-card-label strong {
    display: block;
    color: #fff;
    font-size: 1rem;
    font-weight: 780;
    line-height: 1.2;
  }

  .travel-card-label span {
    color: rgba(255,255,255,.72);
    font-size: .78rem;
  }

  .travel-lightbox[hidden] {
    display: none;
  }

  .travel-lightbox {
    position: fixed;
    inset: 0;
    z-index: 40;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: rgba(7, 10, 11, .82);
    backdrop-filter: blur(6px);
    opacity: 0;
    transition: opacity .22s ease;
  }

  .travel-lightbox.is-visible {
    opacity: 1;
  }

  .travel-lightbox-panel {
    position: relative;
    width: min(92vw, 1200px);
    max-height: 92vh;
    transform: translateY(18px) scale(.965);
    opacity: 0;
    transition: transform .26s cubic-bezier(.2, .8, .2, 1), opacity .22s ease;
  }

  .travel-lightbox.is-visible .travel-lightbox-panel {
    transform: translateY(0) scale(1);
    opacity: 1;
  }

  .travel-lightbox-close {
    position: absolute;
    top: -1rem;
    right: -1rem;
    width: 2.75rem;
    height: 2.75rem;
    border: 0;
    border-radius: 999px;
    background: rgba(255,255,255,.16);
    color: #fff;
    font-size: 1.6rem;
    line-height: 1;
    cursor: pointer;
  }

  .travel-lightbox-close:hover {
    background: rgba(255,255,255,.24);
  }

  .travel-lightbox img {
    display: block;
    max-width: 100%;
    max-height: 92vh;
    margin: 0 auto;
    border-radius: .7rem;
    box-shadow: 0 24px 80px rgba(0, 0, 0, .34);
  }

  .travel-lightbox-caption {
    margin-top: .9rem;
    text-align: center;
    color: rgba(255,255,255,.88);
  }

  .travel-lightbox-caption strong {
    display: block;
    font-size: 1rem;
    font-weight: 700;
  }

  .travel-lightbox-caption span {
    font-size: .84rem;
    color: rgba(255,255,255,.68);
  }

  body.travel-lightbox-open {
    overflow: hidden;
  }
</style>

<script>
  window._AMapSecurityConfig = {
    securityJsCode: "4c4e81286a49c64486a59de75fb5afc9",
  };
</script>
<script src="https://webapi.amap.com/maps?v=2.0&key=76640eae2046df5dfe9f4072494676a3&plugin=AMap.DistrictSearch"></script>
<script>
  const travelMap = new AMap.Map("travel-map-container", {
    center: [104.397428, 36.90923],
    zoom: 4.2,
  });

  const cityList = [
    {{TRAVEL_MAP_CITY_LIST}}
  ];

  loadCities();

  function loadCities() {
    const district = new AMap.DistrictSearch({
      subdistrict: 0,
      extensions: "all",
      level: "city",
    });

    let index = 0;
    const intervalId = setInterval(() => {
      if (index < cityList.length) {
        searchCity(district, cityList[index]);
        index += 1;
      } else {
        clearInterval(intervalId);
      }
    }, 500);
  }

  function searchCity(district, city) {
    district.search(city, (status, result) => {
      if (!result) {
        console.log("请正确填写名称或更新其他名称:" + city);
        return;
      }
      drawBounds(result.districtList[0].boundaries);
    });
  }

  function drawBounds(bounds) {
    if (!bounds) return;

    const polygon = new AMap.Polygon({
      strokeWeight: 1,
      path: bounds.map((bound) => [bound]),
      fillOpacity: 0.4,
      fillColor: "#80d8ff",
      strokeColor: "#0091ea",
    });

    travelMap.add(polygon);
  }
</script>

<div class="travel-gallery-header">
  <h2>旅行相册</h2>
  <span>悬停查看城市，点击查看大图</span>
</div>

{{TRAVEL_GALLERY}}

<div id="travel-lightbox" class="travel-lightbox" hidden>
  <div class="travel-lightbox-panel">
    <button id="travel-lightbox-close" class="travel-lightbox-close" type="button" aria-label="关闭预览">×</button>
    <img id="travel-lightbox-image" src="" alt="">
    <div class="travel-lightbox-caption">
      <strong id="travel-lightbox-city"></strong>
      <span id="travel-lightbox-time"></span>
    </div>
  </div>
</div>

<script>
  const travelLightbox = document.getElementById("travel-lightbox");
  const travelLightboxImage = document.getElementById("travel-lightbox-image");
  const travelLightboxCity = document.getElementById("travel-lightbox-city");
  const travelLightboxTime = document.getElementById("travel-lightbox-time");
  const travelLightboxClose = document.getElementById("travel-lightbox-close");
  let travelLightboxCloseTimer = null;

  const travelCards = document.querySelectorAll(".travel-card");
  for (const card of travelCards) {
    const image = card.querySelector("img");
    const city = card.querySelector(".travel-card-label strong")?.textContent?.trim() || image?.alt || "";
    const time = card.querySelector(".travel-card-label span")?.textContent?.trim() || "";
    if (!image) continue;

    image.setAttribute("tabindex", "0");
    image.setAttribute("role", "button");
    image.setAttribute("aria-label", `查看 ${city} 原图`);

    image.addEventListener("click", () => openTravelLightbox(image, city, time));
    image.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openTravelLightbox(image, city, time);
      }
    });
  }

  function openTravelLightbox(image, city, time) {
    if (travelLightboxCloseTimer) {
      clearTimeout(travelLightboxCloseTimer);
      travelLightboxCloseTimer = null;
    }
    travelLightboxImage.src = image.currentSrc || image.src;
    travelLightboxImage.alt = city;
    travelLightboxCity.textContent = city;
    travelLightboxTime.textContent = time;
    travelLightbox.hidden = false;
    document.body.classList.add("travel-lightbox-open");
    requestAnimationFrame(() => {
      travelLightbox.classList.add("is-visible");
    });
  }

  function closeTravelLightbox() {
    travelLightbox.classList.remove("is-visible");
    document.body.classList.remove("travel-lightbox-open");
    if (travelLightboxCloseTimer) clearTimeout(travelLightboxCloseTimer);
    travelLightboxCloseTimer = setTimeout(() => {
      travelLightbox.hidden = true;
      travelLightboxImage.src = "";
      travelLightboxCloseTimer = null;
    }, 260);
  }

  travelLightboxClose.addEventListener("click", closeTravelLightbox);
  travelLightbox.addEventListener("click", (event) => {
    const clickedImage = event.target === travelLightboxImage;
    const clickedClose = event.target === travelLightboxClose;
    const clickedCaption = event.target.closest(".travel-lightbox-caption");
    if (!clickedImage && !clickedClose && !clickedCaption) closeTravelLightbox();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !travelLightbox.hidden) {
      closeTravelLightbox();
    }
  });
</script>
