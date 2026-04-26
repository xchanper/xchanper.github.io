---
title: 旅行地图
date: 1970-01-01
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
    cursor: default;
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
    "盐城市", "上海市", "杭州市", "黄山市", "南京市",
    "北京市", "长沙市", "张家界市", "天津市", "广州市",
    "武汉市", "南昌市", "苏州市", "济南市", "泰安市",
    "湘潭市", "西安市", "萍乡市", "西宁市", "拉萨市",
    "林芝市", "山南市", "日喀则市", "那曲市", "兰州市",
    "秦皇岛", "威海市", "烟台市", "大连市", "哈尔滨市",
    "海口市", "三亚市", "保定市", "成都市", "阿坝藏族羌族自治州",
    "廊坊市", "青岛市", "新疆维吾尔自治区", "深圳市", "香港特别行政区",
    "珠海市", "澳门特别行政区", "衡阳市", "丽江市", "大理白族自治州"
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
  <span>悬停查看城市</span>
</div>

<div class="travel-gallery">
  <div class="travel-card"><img src="/img/游记/丽江.jpeg" loading="lazy" alt="丽江"><div class="travel-card-label"><strong>丽江</strong><span>2026.04</span></div></div>
  <div class="travel-card"><img src="/img/游记/衡阳.jpg" loading="lazy" alt="衡阳"><div class="travel-card-label"><strong>衡阳</strong><span>2026.02</span></div></div>
  <div class="travel-card"><img src="/img/游记/澳门.jpg" loading="lazy" alt="澳门"><div class="travel-card-label"><strong>澳门</strong><span>2026.01</span></div></div>
  <div class="travel-card"><img src="/img/游记/珠海.jpg" loading="lazy" alt="珠海"><div class="travel-card-label"><strong>珠海</strong><span>2026.01</span></div></div>
  <div class="travel-card"><img src="/img/游记/香港.jpg" loading="lazy" alt="香港"><div class="travel-card-label"><strong>香港</strong><span>2025.12</span></div></div>
  <div class="travel-card"><img src="/img/游记/深圳.jpg" loading="lazy" alt="深圳"><div class="travel-card-label"><strong>深圳</strong><span>2025.12</span></div></div>
  <div class="travel-card"><img src="/img/游记/新疆.jpg" loading="lazy" alt="新疆"><div class="travel-card-label"><strong>新疆</strong><span>2025.10</span></div></div>
  <div class="travel-card"><img src="/img/游记/青岛.jpg" loading="lazy" alt="青岛"><div class="travel-card-label"><strong>青岛</strong><span>2025.07</span></div></div>
  <div class="travel-card"><img src="/img/游记/廊坊.jpg" loading="lazy" alt="廊坊"><div class="travel-card-label"><strong>廊坊</strong><span>2025.06</span></div></div>
  <div class="travel-card"><img src="/img/游记/阿坝.jpg" loading="lazy" alt="阿坝"><div class="travel-card-label"><strong>阿坝</strong><span>2025.05</span></div></div>
  <div class="travel-card"><img src="/img/游记/成都.jpg" loading="lazy" alt="成都"><div class="travel-card-label"><strong>成都</strong><span>2025.05</span></div></div>
  <div class="travel-card"><img src="/img/游记/大理.jpeg" loading="lazy" alt="大理"><div class="travel-card-label"><strong>大理</strong><span>2025.04</span></div></div>
  <div class="travel-card"><img src="/img/游记/保定.jpg" loading="lazy" alt="保定"><div class="travel-card-label"><strong>保定</strong><span>2025.04</span></div></div>
  <div class="travel-card"><img src="/img/游记/三亚.jpg" loading="lazy" alt="三亚"><div class="travel-card-label"><strong>三亚</strong><span>2025.02</span></div></div>
  <div class="travel-card"><img src="/img/游记/海口.jpg" loading="lazy" alt="海口"><div class="travel-card-label"><strong>海口</strong><span>2025.02</span></div></div>
  <div class="travel-card"><img src="/img/游记/哈尔滨.jpg" loading="lazy" alt="哈尔滨"><div class="travel-card-label"><strong>哈尔滨</strong><span>2025.02</span></div></div>
  <div class="travel-card"><img src="/img/游记/大连.jpg" loading="lazy" alt="大连"><div class="travel-card-label"><strong>大连</strong><span>2024.10</span></div></div>
  <div class="travel-card"><img src="/img/游记/烟台.jpg" loading="lazy" alt="烟台"><div class="travel-card-label"><strong>烟台</strong><span>2024.10</span></div></div>
  <div class="travel-card"><img src="/img/游记/威海.jpg" loading="lazy" alt="威海"><div class="travel-card-label"><strong>威海</strong><span>2024.09</span></div></div>
  <div class="travel-card"><img src="/img/游记/秦皇岛.jpg" loading="lazy" alt="秦皇岛"><div class="travel-card-label"><strong>秦皇岛</strong><span>2024.09</span></div></div>
  <div class="travel-card"><img src="/img/游记/兰州.jpg" loading="lazy" alt="兰州"><div class="travel-card-label"><strong>兰州</strong><span>2024.06</span></div></div>
  <div class="travel-card"><img src="/img/游记/那曲.jpg" loading="lazy" alt="那曲"><div class="travel-card-label"><strong>那曲</strong><span>2024.06</span></div></div>
  <div class="travel-card"><img src="/img/游记/日喀则.jpg" loading="lazy" alt="日喀则"><div class="travel-card-label"><strong>日喀则</strong><span>2024.06</span></div></div>
  <div class="travel-card"><img src="/img/游记/山南.jpg" loading="lazy" alt="山南"><div class="travel-card-label"><strong>山南</strong><span>2024.06</span></div></div>
  <div class="travel-card"><img src="/img/游记/林芝.jpg" loading="lazy" alt="林芝"><div class="travel-card-label"><strong>林芝</strong><span>2024.06</span></div></div>
  <div class="travel-card"><img src="/img/游记/拉萨.jpg" loading="lazy" alt="拉萨"><div class="travel-card-label"><strong>拉萨</strong><span>2024.06</span></div></div>
  <div class="travel-card"><img src="/img/游记/西宁.jpg" loading="lazy" alt="西宁"><div class="travel-card-label"><strong>西宁</strong><span>2024.06</span></div></div>
  <div class="travel-card"><img src="/img/游记/萍乡.jpg" loading="lazy" alt="萍乡"><div class="travel-card-label"><strong>萍乡</strong><span>2024.05</span></div></div>
  <div class="travel-card"><img src="/img/游记/西安.jpg" loading="lazy" alt="西安"><div class="travel-card-label"><strong>西安</strong><span>2024.04</span></div></div>
  <div class="travel-card"><img src="/img/游记/湘潭.jpg" loading="lazy" alt="湘潭"><div class="travel-card-label"><strong>湘潭</strong><span>2024.04</span></div></div>
  <div class="travel-card"><img src="/img/游记/泰安.jpg" loading="lazy" alt="泰安"><div class="travel-card-label"><strong>泰安</strong><span>2024.02</span></div></div>
  <div class="travel-card"><img src="/img/游记/济南.jpg" loading="lazy" alt="济南"><div class="travel-card-label"><strong>济南</strong><span>2024.02</span></div></div>
  <div class="travel-card"><img src="/img/游记/苏州.jpg" loading="lazy" alt="苏州"><div class="travel-card-label"><strong>苏州</strong><span>2024.02</span></div></div>
  <div class="travel-card"><img src="/img/游记/南昌.jpg" loading="lazy" alt="南昌"><div class="travel-card-label"><strong>南昌</strong><span>2024.02</span></div></div>
  <div class="travel-card"><img src="/img/游记/武汉.jpg" loading="lazy" alt="武汉"><div class="travel-card-label"><strong>武汉</strong><span>2024.01</span></div></div>
  <div class="travel-card"><img src="/img/游记/盐城.jpg" loading="lazy" alt="盐城"><div class="travel-card-label"><strong>盐城</strong><span>2024.01</span></div></div>
  <div class="travel-card"><img src="/img/游记/广州.jpg" loading="lazy" alt="广州"><div class="travel-card-label"><strong>广州</strong><span>2023.10</span></div></div>
  <div class="travel-card"><img src="/img/游记/天津.jpg" loading="lazy" alt="天津"><div class="travel-card-label"><strong>天津</strong><span>2023.09</span></div></div>
  <div class="travel-card"><img src="/img/游记/张家界.jpg" loading="lazy" alt="张家界"><div class="travel-card-label"><strong>张家界</strong><span>2023.05</span></div></div>
  <div class="travel-card"><img src="/img/游记/长沙.jpg" loading="lazy" alt="长沙"><div class="travel-card-label"><strong>长沙</strong><span>2021.09</span></div></div>
  <div class="travel-card"><img src="/img/游记/北京.jpg" loading="lazy" alt="北京"><div class="travel-card-label"><strong>北京</strong><span>2019.05</span></div></div>
  <div class="travel-card"><img src="/img/游记/南京.jpg" loading="lazy" alt="南京"><div class="travel-card-label"><strong>南京</strong><span>2017.09</span></div></div>
  <div class="travel-card"><img src="/img/游记/黄山.jpg" loading="lazy" alt="黄山"><div class="travel-card-label"><strong>黄山</strong><span>2017.07</span></div></div>
  <div class="travel-card"><img src="/img/游记/杭州.jpg" loading="lazy" alt="杭州"><div class="travel-card-label"><strong>杭州</strong><span>2014.06</span></div></div>
  <div class="travel-card"><img src="/img/游记/上海.jpg" loading="lazy" alt="上海"><div class="travel-card-label"><strong>上海</strong><span>Grow</span></div></div>
  <div class="travel-card"><img src="/img/游记/阜宁.jpg" loading="lazy" alt="阜宁"><div class="travel-card-label"><strong>阜宁</strong><span>Home</span></div></div>
</div>
