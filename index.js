'use strict';

(function() {
  var Marzipano = window.Marzipano;
  var bowser = window.bowser;
  var screenfull = window.screenfull;
  var data = window.APP_DATA;

  var panoElement = document.querySelector('#pano');
  var sceneNameElement = document.querySelector('#titleBar .sceneName');
  var sceneListElement = document.querySelector('#sceneList');
  var sceneElements = document.querySelectorAll('#sceneList .scene');
  var sceneListToggleElement = document.querySelector('#sceneListToggle');
  var autorotateToggleElement = document.querySelector('#autorotateToggle');
  var fullscreenToggleElement = document.querySelector('#fullscreenToggle');

  // Cấu hình Viewer
  var viewerOpts = { controls: { mouseViewMode: data.settings.mouseViewMode } };
  var viewer = new Marzipano.Viewer(panoElement, viewerOpts);

  // Khởi tạo các Scene
  var scenes = data.scenes.map(function(data) {
    var source = Marzipano.ImageUrlSource.fromString("tiles/" + data.id + "/{z}/{f}/{y}/{x}.jpg", { cubeMapPreviewUrl: "tiles/" + data.id + "/preview.jpg" });
    var geometry = new Marzipano.CubeGeometry(data.levels);
    var limiter = Marzipano.RectilinearView.limit.traditional(data.faceSize, 100*Math.PI/180, 120*Math.PI/180);
    var view = new Marzipano.RectilinearView(data.initialViewParameters, limiter);
    var scene = viewer.createScene({ source: source, geometry: geometry, view: view, pinFirstLevel: true });

    // Tạo Link Hotspots (Các điểm di chuyển)
    data.linkHotspots.forEach(function(hotspot) {
      var element = createLinkHotspotElement(hotspot);
      scene.hotspotContainer().createHotspot(element, { yaw: hotspot.yaw, pitch: hotspot.pitch });
    });

    return { data: data, scene: scene, view: view };
  });

  // Hàm chuyển cảnh có tích hợp URL
  function switchScene(scene, customParams) {
    scene.view.setParameters(customParams || scene.data.initialViewParameters);
    scene.scene.switchTo();
    updateSceneName(scene);
    updateSceneList(scene);

    var view = scene.view;
    var updateUrl = function() {
      var urlParams = [ scene.data.id, view.yaw().toFixed(4), view.pitch().toFixed(4), view.fov().toFixed(4) ];
      window.history.replaceState(null, null, '?view=' + urlParams.join('-'));
    };

    updateUrl();
    view.addEventListener('change', updateUrl);
  }

  // --- PHẦN ĐỌC URL KHI MỞ TRANG (FIX LỖI DẤU GẠCH NGANG) ---
  function getParams() {
    var params = {};
    window.location.search.slice(1).split('&').forEach(function(p) {
      var pair = p.split('=');
      if (pair[0]) params[pair[0]] = pair[1];
    });
    return params;
  }

  var urlData = getParams();
  if (urlData && urlData.view) {
    var parts = urlData.view.split('-');
    var fov = parts.pop(), pitch = parts.pop(), yaw = parts.pop();
    var id = parts.join('-');
    var startScene = findSceneById(id);
    if (startScene) {
      switchScene(startScene, { yaw: parseFloat(yaw), pitch: parseFloat(pitch), fov: parseFloat(fov) });
    } else { switchScene(scenes[0]); }
  } else {
    switchScene(scenes[0]);
  }

  // Tiện ích hỗ trợ
  function findSceneById(id) {
    for (var i = 0; i < scenes.length; i++) { if (scenes[i].data.id === id) return scenes[i]; }
    return null;
  }
  function updateSceneName(scene) { sceneNameElement.innerHTML = scene.data.name; }
  function updateSceneList(scene) {
    for (var i = 0; i < sceneElements.length; i++) {
      var el = sceneElements[i];
      el.classList.toggle('current', el.getAttribute('data-id') === scene.data.id);
    }
  }

  // Xử lý Click Menu Danh sách
  sceneElements.forEach(function(el) {
    el.addEventListener('click', function() {
      var target = findSceneById(el.getAttribute('data-id'));
      if (target) switchScene(target);
    });
  });

  // Nút đóng mở Menu
  sceneListToggleElement.addEventListener('click', function() {
    sceneListElement.classList.toggle('enabled');
    sceneListToggleElement.classList.toggle('enabled');
  });

  // Hotspot Click
  function createLinkHotspotElement(hotspot) {
    var wrapper = document.createElement('div');
    wrapper.classList.add('hotspot', 'link-hotspot');
    var icon = document.createElement('img');
    icon.src = 'img/link.png';
    icon.classList.add('link-hotspot-icon');
    wrapper.appendChild(icon);
    wrapper.addEventListener('click', function() {
      var target = findSceneById(hotspot.target);
      if (target) switchScene(target);
    });
    return wrapper;
  }

  // Fullscreen & Controls
  if (screenfull.enabled) {
    fullscreenToggleElement.addEventListener('click', function() { screenfull.toggle(); });
  }

  // Đăng ký các nút zoom/di chuyển (nếu cần)
  var velocity = 0.7; var friction = 3;
  var controls = viewer.controls();
  controls.registerMethod('upElement', new Marzipano.ElementPressControlMethod(document.querySelector('#viewUp'), 'y', -velocity, friction), true);
  controls.registerMethod('downElement', new Marzipano.ElementPressControlMethod(document.querySelector('#viewDown'), 'y', velocity, friction), true);
  controls.registerMethod('leftElement', new Marzipano.ElementPressControlMethod(document.querySelector('#viewLeft'), 'x', -velocity, friction), true);
  controls.registerMethod('rightElement', new Marzipano.ElementPressControlMethod(document.querySelector('#viewRight'), 'x', velocity, friction), true);
  controls.registerMethod('inElement', new Marzipano.ElementPressControlMethod(document.querySelector('#viewIn'), 'zoom', -velocity, friction), true);
  controls.registerMethod('outElement', new Marzipano.ElementPressControlMethod(document.querySelector('#viewOut'), 'zoom', velocity, friction), true);

})();