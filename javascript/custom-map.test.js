/**
 * @jest-environment jsdom
 */

describe('CustomZoomControl integration', () => {
  let zoomInBtn;
  let zoomOutBtn;
  let mapMock;
  let readyCallback;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = `
      <div id="map-container"></div>
      <div id="cd-zoom-in"></div>
      <div id="cd-zoom-out"></div>
    `;

    // Grab the buttons
    zoomInBtn = document.getElementById('cd-zoom-in');
    zoomOutBtn = document.getElementById('cd-zoom-out');

    // Mock jQuery
    global.jQuery = jest.fn((selector) => {
      return {
        ready: jest.fn((cb) => {
          if (selector === document) {
            readyCallback = cb;
          }
        }),
      };
    });

    // Mock the map object
    mapMock = {
      getZoom: jest.fn().mockReturnValue(15),
      setZoom: jest.fn(),
      controls: {
        left_top: [],
        push: function(val) { this.left_top.push(val); }
      }
    };

    // Make sure controls.left_top is used properly
    mapMock.controls['left_top'] = [];
    mapMock.controls['left_top'].push = function(item) {
        this[this.length] = item;
    };

    // Mock Google Maps API
    global.google = {
      maps: {
        LatLng: jest.fn(),
        MapTypeId: { ROADMAP: 'roadmap' },
        Map: jest.fn(() => mapMock),
        Marker: jest.fn(),
        ControlPosition: { LEFT_TOP: 'left_top' },
        event: {
          addDomListener: jest.fn((element, event, callback) => {
            if (element) {
              element.addEventListener(event, callback);
            }
          })
        }
      }
    };

    global.navigator = {
      userAgent: 'Mozilla/5.0'
    };

    // Require the script so that the ready callback is registered
    jest.isolateModules(() => {
        require('./custom-map.js');
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete global.google;
    delete global.jQuery;
    delete global.navigator;
  });

  test('appends zoom buttons to the control div and handles clicks', () => {
    // Execute the code inside $(document).ready
    readyCallback();

    // The map.controls['left_top'] array should now contain the control div
    const controlDiv = mapMock.controls['left_top'][0];
    expect(controlDiv).toBeDefined();

    // Verify elements are appended
    expect(controlDiv.contains(zoomInBtn)).toBe(true);
    expect(controlDiv.contains(zoomOutBtn)).toBe(true);

    // Verify click event handlers
    expect(global.google.maps.event.addDomListener).toHaveBeenCalledWith(
      zoomInBtn,
      'click',
      expect.any(Function)
    );
    expect(global.google.maps.event.addDomListener).toHaveBeenCalledWith(
      zoomOutBtn,
      'click',
      expect.any(Function)
    );

    // Trigger zoom in click
    zoomInBtn.click();
    expect(mapMock.getZoom).toHaveBeenCalled();
    expect(mapMock.setZoom).toHaveBeenCalledWith(16);

    // Trigger zoom out click
    zoomOutBtn.click();
    expect(mapMock.setZoom).toHaveBeenCalledWith(14);
  });
});
