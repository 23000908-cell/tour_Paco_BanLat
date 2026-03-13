'use strict';

(function() {
  var Marzipano = window.Marzipano;
  var data = window.APP_DATA;

  var panoElement = document.querySelector('#pano');
  var viewer = new Marzipano.Viewer(panoElement, { controls: { mouseViewMode: data.settings.mouseViewMode } });

  var scenes = data.scenes.map(function(data) {
    var source = Marzipano.ImageUrlSource.fromString("tiles/" + data.id + "/{z}/{f}/{y}/{x}.jpg", { cubeMapPreviewUrl: "tiles/" + data.id + "/preview.jpg" });
    var geometry = new Marzipano.CubeGeometry(data.levels);
    var limiter = Marzipano.RectilinearView.limit.traditional(data.faceSize, 100*Math.PI/180, 120*Math.PI/180);
    var view = new Marzipano.RectilinearView(data.initialViewParameters, limiter);
    var scene = viewer.createScene({ source: source, geometry: geometry, view: view, pinFirstLevel: true });
    return { data: data, scene: scene, view: view };
  });

  function switchScene(scene, customParams) {
    scene.scene.switchTo();
    if (customParams) { scene.view.setParameters(customParams); }
    
    var updateUrl = function() {
      var urlParams = [ scene.data.id, scene.view.yaw().toFixed(4), scene.view.pitch().toFixed(4), scene.view.fov().toFixed(4) ];
      window.history.replaceState(null, null, '?view=' + urlParams.join('-'));
    };

    updateUrl();
    scene.view.addEventListener('change', updateUrl);
    document.querySelector('.sceneName').innerHTML = scene.data.name;
  }

  function findSceneById(id) {
    for (var i = 0; i < scenes.length; i++) { if (scenes[i].data.id === id) return scenes[i]; }
    return null;
  }

  // XỬ LÝ URL
  var urlStr = window.location.search.substring(1);
  var urlParams = {};
  urlStr.split('&').forEach(function(pair) { var parts = pair.split('='); if(parts[0]) urlParams[parts[0]] = parts[1]; });

  if (urlParams.view) {
    var p = urlParams.view.split('-');
    var fov = p.pop(), pitch = p.pop(), yaw = p.pop(), id = p.join('-');
    var startScene = findSceneById(id);
    if (startScene) {
      switchScene(startScene, { yaw: parseFloat(yaw), pitch: parseFloat(pitch), fov: parseFloat(fov) });
    } else { switchScene(scenes[0]); }
  } else { switchScene(scenes[0]); }

  // Sự kiện Click danh sách cảnh
  document.querySelectorAll('#sceneList .scene').forEach(function(el) {
    el.addEventListener('click', function() {
      var scene = findSceneById(el.getAttribute('data-id'));
      if (scene) switchScene(scene);
    });
  });
})();