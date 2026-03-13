/*
 * MARZIPANO URL-LINK ENABLED - FINAL FIX
 */
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

  if (window.matchMedia) {
    var setMode = function() {
      if (mql.matches) {
        document.body.classList.remove('desktop');
        document.body.classList.add('mobile');
      } else {
        document.body.classList.remove('mobile');
        document.body.classList.add('desktop');
      }
    };
    var mql = matchMedia("(max-width: 500px), (max-height: 500px)");
    setMode();
    mql.addListener(setMode);
  } else {
    document.body.classList.add('desktop');
  }

  document.body.classList.add('no-touch');
  window.addEventListener('touchstart', function() {
    document.body.classList.remove('no-touch');
    document.body.classList.add('touch');
  });

  var viewerOpts = {
    controls: { mouseViewMode: data.settings.mouseViewMode }
  };

  var viewer = new Marzipano.Viewer(panoElement, viewerOpts);

  var scenes = data.scenes.map(function(data) {
    var urlPrefix = "tiles";
    var source = Marzipano.ImageUrlSource.fromString(
      urlPrefix + "/" + data.id + "/{z}/{f}/{y}/{x}.jpg",
      { cubeMapPreviewUrl: urlPrefix + "/" + data.id + "/preview.jpg" });
    var geometry = new Marzipano.CubeGeometry(data.levels);
    var limiter = Marzipano.RectilinearView.limit.traditional(data.faceSize, 100*Math.PI/180, 120*Math.PI/180);
    
    // Khởi tạo view tạm thời
    var view = new Marzipano.RectilinearView(data.initialViewParameters, limiter);

    var scene = viewer.createScene({
      source: source,
      geometry: geometry,
      view: view,
      pinFirstLevel: true
    });

    data.linkHotspots.forEach(function(hotspot) {
      var element = createLinkHotspotElement(hotspot);
      scene.hotspotContainer().createHotspot(element, { yaw: hotspot.yaw, pitch: hotspot.pitch });
    });

    return { data: data, scene: scene, view: view };
  });

  function switchScene(scene, customParams) {
    stopAutorotate();
    
    // Nếu có tọa độ từ URL thì dùng, không thì dùng mặc định trong data.js
    var params = customParams || scene.data.initialViewParameters;
    scene.view.setParameters(params);
    
    scene.scene.switchTo();
    startAutorotate();
    updateSceneName(scene);
    updateSceneList(scene);

    // Lắng nghe sự kiện xoay để đổi URL
    var view = scene.view;
    var updateUrl = function() {
      var urlParams = [
        scene.data.id,
        view.yaw().toFixed(4),
        view.pitch().toFixed(4),
        view.fov().toFixed(4)
      ];
      window.history.replaceState(null, null, '?view=' + urlParams.join('-'));
    };

    updateUrl();
    view.addEventListener('change', updateUrl);
  }

  // --- LOGIC ĐỌC URL KHI MỞ TRANG ---
  function getUrlParams() {
    var search = window.location.search.slice(1);
    if (!search) return null;
    var params = {};
    search.split('&').forEach(function(part) {
      var item = part.split('=');
      params[item[0]] = item[1];
    });
    return params;
  }

  var urlData = getUrlParams();
  if (urlData && urlData.view) {
    var parts = urlData.view.split('-');
    var fov = parts.pop();
    var pitch = parts.pop();
    var yaw = parts.pop();
    var sceneId = parts.join('-');
    
    var startScene = findSceneById(sceneId);
    if (startScene) {
      switchScene(startScene, {
        yaw: parseFloat(yaw),
        pitch: parseFloat(pitch),
        fov: parseFloat(fov)
      });
    } else {
      switchScene(scenes[0]);
    }
  } else {
    switchScene(scenes[0]);
  }

  // Các hàm bổ trợ (giữ nguyên gốc)
  function updateSceneName(scene) { sceneNameElement.innerHTML = scene.data.name; }
  function updateSceneList(scene) {
    for (var i = 0; i < sceneElements.length; i++) {
      var el = sceneElements[i];
      el.classList.toggle('current', el.getAttribute('data-id') === scene.data.id);
    }
  }
  function findSceneById(id) {
    for (var i = 0; i < scenes.length; i++) { if (scenes[i].data.id === id) return scenes[i]; }
    return null;
  }
  function stopAutorotate() { viewer.stopMovement(); viewer.setIdleMovement(Infinity); }
  function startAutorotate() { /* Tùy chỉnh nếu cần */ }
  function createLinkHotspotElement(hotspot) {
    var wrapper = document.createElement('div');
    wrapper.classList.add('hotspot', 'link-hotspot');
    var icon = document.createElement('img');
    icon.src = 'img/link.png';
    icon.classList.add('link-hotspot-icon');
    wrapper.appendChild(icon);
    wrapper.addEventListener('click', function() { switchScene(findSceneById(hotspot.target)); });
    return wrapper;
  }
  function toggleSceneList() { sceneListElement.classList.toggle('enabled'); }
  function showSceneList() { sceneListElement.classList.add('enabled'); }

  // Các nút điều khiển view
  var controls = viewer.controls();
  // (Bạn có thể thêm lại các registerMethod ở đây nếu cần nút bấm mũi tên)

})();