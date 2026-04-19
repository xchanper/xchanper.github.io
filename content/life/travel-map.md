---
title: 旅行地图
date: 1970-01-01
---
用地图记录走过的城市。浅蓝色区域是已经点亮的地方，后面继续慢慢补全。

<div class="travel-map-embed">
  <div id="travel-map-container"></div>
</div>

<link rel="stylesheet" href="https://a.amap.com/jsapi_demos/static/demo-center/css/demo-center.css">

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
</style>

<script>
  window._AMapSecurityConfig = {
    securityJsCode: "4c4e81286a49c64486a59de75fb5afc9",
  };
</script>
<script src="https://webapi.amap.com/maps?v=2.0&key=76640eae2046df5dfe9f4072494676a3&plugin=AMap.DistrictSearch"></script>
<script src="https://a.amap.com/jsapi_demos/static/demo-center/js/demoutils.js"></script>
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
    "珠海市", "澳门特别行政区", "衡阳市"
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

# 旅行相册

## 2026.02 衡阳

<img src="/img/游记/衡阳.jpg" class="travel-img">

## 2026.01 澳门

<img src="/img/游记/澳门.jpg" class="travel-img">

## 2026.01 珠海

<img src="/img/游记/珠海.jpg" class="travel-img">

## 2025.12 香港

<img src="/img/游记/香港.jpg" class="travel-img">

## 2025.12 深圳

<img src="/img/游记/深圳.jpg" class="travel-img">

## 2025.10 新疆

<img src="/img/游记/新疆.jpg" class="travel-img">

## 2025.07 青岛

<img src="/img/游记/青岛.jpg" class="travel-img">

## 2025.06 廊坊

<img src="/img/游记/廊坊.jpg" class="travel-img">

## 2025.05 阿坝

<img src="/img/游记/阿坝.jpg" class="travel-img">

## 2025.05 成都

<img src="/img/游记/成都.jpg" class="travel-img">

## 2025.04 保定

<img src="/img/游记/保定.jpg" class="travel-img">

## 2025.02 三亚

<img src="/img/游记/三亚.jpg" class="travel-img">

## 2025.02 海口

<img src="/img/游记/海口.jpg" class="travel-img">

## 2025.02 哈尔滨

<img src="/img/游记/哈尔滨.jpg" class="travel-img">

## 2024.10 大连

<img src="/img/游记/大连.jpg" class="travel-img">

## 2024.10 烟台

<img src="/img/游记/烟台.jpg" class="travel-img">

## 2024.09 威海

<img src="/img/游记/威海.jpg" class="travel-img">

## 2024.09 秦皇岛

<img src="/img/游记/秦皇岛.jpg" class="travel-img">

## 2024.06 兰州

<img src="/img/游记/兰州.jpg" class="travel-img">

## 2024.06 那曲

<img src="/img/游记/那曲.jpg" class="travel-img">

## 2024.06 日喀则

<img src="/img/游记/日喀则.jpg" class="travel-img">

## 2024.06 山南

<img src="/img/游记/山南.jpg" class="travel-img">

## 2024.06 林芝

<img src="/img/游记/林芝.jpg" class="travel-img">

## 2024.06 拉萨

<img src="/img/游记/拉萨.jpg" class="travel-img">

## 2024.06 西宁

<img src="/img/游记/西宁.jpg" class="travel-img">

## 2024.05 萍乡

<img src="/img/游记/萍乡.jpg" class="travel-img">

## 2024.04 西安

<img src="/img/游记/西安.jpg" class="travel-img">

## 2024.04 湘潭

<img src="/img/游记/湘潭.jpg" class="travel-img">

## 2024.02 泰安

<img src="/img/游记/泰安.jpg" class="travel-img">

## 2024.02 济南

<img src="/img/游记/济南.jpg" class="travel-img">

## 2024.02 苏州

<img src="/img/游记/苏州.jpg" class="travel-img">

## 2024.02 南昌

<img src="/img/游记/南昌.jpg" class="travel-img">

## 2024.01 武汉

<img src="/img/游记/武汉.jpg" class="travel-img">

## 2024.01 盐城

<img src="/img/游记/盐城.jpg" class="travel-img">

## 2023.10 广州

<img src="/img/游记/广州.jpg" class="travel-img">

## 2023.09 天津

<img src="/img/游记/天津.jpg" class="travel-img">

## 2023.05 张家界

<img src="/img/游记/张家界.jpg" class="travel-img">

## 2021.09 长沙

<img src="/img/游记/长沙.jpg" class="travel-img">

## 2019.05 北京

<img src="/img/游记/北京.jpg" class="travel-img">

## 2017.09 南京

<img src="/img/游记/南京.jpg" class="travel-img">

## 2017.07 黄山

<img src="/img/游记/黄山.jpg" class="travel-img">

## 2014.06 杭州

<img src="/img/游记/杭州.jpg" class="travel-img">

## Grow 上海

<img src="/img/游记/上海.jpg" class="travel-img">

## Home 阜宁

<img src="/img/游记/阜宁.jpg" class="travel-img">
