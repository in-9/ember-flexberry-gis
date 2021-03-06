/**
  @module ember-flexberry-gis
*/

import Ember from 'ember';
import DynamicPropertiesMixin from 'ember-flexberry-gis/mixins/dynamic-properties';
import LeafletOptionsMixin from 'ember-flexberry-gis/mixins/leaflet-options';

const {
  assert
} = Ember;

/**
  BaseLayer component for other flexberry-gis layers.

  @class BaseLayerComponent
  @extends <a href="http://emberjs.com/api/classes/Ember.Component.html">Ember.Component</a>
  @uses DynamicPropertiesMixin
  @uses LeafletOptionsMixin
 */
export default Ember.Component.extend(
  DynamicPropertiesMixin,
  LeafletOptionsMixin, {

    /**
      Leaflet layer object init by settings from model.

      @property _leafletObject
      @type L.Layer
      @default null
      @private
     */
    _leafletObject: null,

    /**
      Promise returning Leaflet layer.

      @property leafletLayerPromise
      @type <a href="https://emberjs.com/api/classes/RSVP.Promise.html">Ember.RSVP.Promise</a>
      @default null
      @private
    */
    _leafletLayerPromise: null,

    /**
      Overload wrapper tag name for disabling wrapper.
     */
    tagName: '',

    /**
      Leaflet map.

      @property leafletMap
      @type <a href="http://leafletjs.com/reference-1.0.0.html#map">L.Map</a>
      @default null
    */
    leafletMap: null,

    /**
      Leaflet container for layers.

      @property leafletContainer
      @type <a href="http://leafletjs.com/reference-1.0.0.html#map">L.Map</a>|<a href="http://leafletjs.com/reference-1.0.0.html#layergroup">L.LayerGroup</a>
      @default null
    */
    leafletContainer: null,

    /**
      Layer metadata.

      @property layerModel
      @type Object
      @default null
    */
    layerModel: null,

    /**
      This layer index, used for layer ordering in Map.

      @property index
      @type Number
      @default null
     */
    index: null,

    /**
      Flag, indicates visible or not current layer on map.

      @property visibility
      @type Boolean
      @default null
     */
    visibility: null,

    /**
      This layer opacity.

      @property opacity
      @type Number
      @default null
     */
    opacity: null,

    /**
      Layer's coordinate reference system (CRS).

      @property crs
      @type <a href="http://leafletjs.com/reference-1.0.0.html#crs">L.CRS</a>
      @readOnly
    */
    crs: Ember.computed('layerModel.crs', 'leafletMap.options.crs', function () {
      let crs = this.get('layerModel.crs');
      if (Ember.isNone(crs)) {
        crs = this.get('leafletMap.options.crs');
      }

      return crs;
    }),

    /**
      This layer bounding box.

      @property bounds
      @type <a href="http://leafletjs.com/reference-1.1.0.html#latlngbounds">L.LatLngBounds</a>
      @readonly
    */
    bounds: null,

    /**
      Creates leaflet layer related to layer type.

      @method _createLayer
      @private
    */
    _createLayer() {
      // Call to 'createLayer' could potentially return a promise,
      // wraping this call into Ember.RSVP.hash helps us to handle straight/promise results universally.
      this.set('_leafletLayerPromise', Ember.RSVP.hash({
        leafletLayer: this.createLayer()
      }).then(({
        leafletLayer
      }) => {
        this.set('_leafletObject', leafletLayer);

        return leafletLayer;
      }).catch((errorMessage) => {
        Ember.Logger.error(`Failed to create leaflet layer for '${this.get('layerModel.name')}': ${errorMessage}`);
      }));
    },

    /**
      Destroys leaflet layer related to layer type.

      @method _destroyLayer
      @private
    */
    _destroyLayer() {
      this._removeLayerFromLeafletContainer();

      this.set('_leafletObject', null);
      this.set('_leafletLayerPromise', null);
    },

    /**
      Sets leaflet layer's state related to actual settings.

      @method _setLayerState
      @private
    */
    _setLayerState() {
      this._setLayerVisibility();
      this._setLayerZIndex();
      this._setLayerOpacity();
    },

    /**
      Sets leaflet layer's zindex.

      @method _setLayerZIndex
      @private
    */
    _setLayerZIndex() {
      let leafletLayer = this.get('_leafletObject');
      if (Ember.isNone(leafletLayer) || Ember.typeOf(leafletLayer.setZIndex) !== 'function') {
        return;
      }

      leafletLayer.setZIndex(this.get('index'));
    },

    /**
      Sets leaflet layer's visibility.

      @method _setLayerVisibility
      @private
    */
    _setLayerVisibility() {
      if (this.get('visibility')) {
        this._addLayerToLeafletContainer();
      } else {
        this._removeLayerFromLeafletContainer();
      }
    },

    /**
      Sets leaflet layer's visibility.

      @method _setLayerOpacity
      @private
    */
    _setLayerOpacity() {
      let leafletLayer = this.get('_leafletObject');
      if (Ember.isNone(leafletLayer) || Ember.typeOf(leafletLayer.setOpacity) !== 'function') {
        return;
      }

      leafletLayer.setOpacity(this.get('opacity'));
    },

    /**
      Adds layer to it's leaflet container.

      @method _addLayerToLeafletContainer
      @private
    */
    _addLayerToLeafletContainer() {
      let leafletContainer = this.get('leafletContainer');
      let leafletLayer = this.get('_leafletObject');
      if (Ember.isNone(leafletContainer) || Ember.isNone(leafletLayer) || leafletContainer.hasLayer(leafletLayer)) {
        return;
      }

      leafletContainer.addLayer(leafletLayer);
    },

    /**
      Removes layer from it's leaflet container.

      @method _removeLayerFromLeafletContainer
      @private
    */
    _removeLayerFromLeafletContainer() {
      let leafletContainer = this.get('leafletContainer');
      let leafletLayer = this.get('_leafletObject');
      if (Ember.isNone(leafletContainer) || Ember.isNone(leafletLayer) || !leafletContainer.hasLayer(leafletLayer)) {
        return;
      }

      leafletContainer.removeLayer(leafletLayer);
    },

    /**
      Observes and handles changes in JSON-string with layer settings.
      Performs layer's recreation with new settings.

      @method visibilityDidChange
      @private
    */
    _indexDidChange: Ember.observer('index', function () {
      this._setLayerZIndex();
    }),

    /**
      Observes and handles changes in {{#crossLink "BaseLayerComponent/visibility:property"}}'visibility' property{{/crossLink}}.
      Switches layer's visibility.

      @method visibilityDidChange
      @private
    */
    _visibilityDidChange: Ember.observer('visibility', function () {
      this._setLayerVisibility();
    }),

    /**
      Observes and handles changes in {{#crossLink "BaseLayerComponent/opacity:property"}}'opacity' property{{/crossLink}}.
      Changes layer's opacity.

      @method opacityDidChange
      @private
    */
    _opacityDidChange: Ember.observer('opacity', function () {
      this._setLayerOpacity();
    }),

    /**
      Handles 'flexberry-map:identify' event of leaflet map.

      @method _identify
      @param {Object} e Event object.
      @param {<a href="http://leafletjs.com/reference-1.0.0.html#rectangle">L.Rectangle</a>} e.boundingBox Leaflet layer
      representing bounding box within which layer's objects must be identified.
      @param {<a href="http://leafletjs.com/reference-1.0.0.html#latlng">L.LatLng</a>} e.latlng Center of the bounding box.
      @param {Object[]} layers Objects describing those layers which must be identified.
      @param {Object[]} results Objects describing identification results.
      Every result-object has the following structure: { layer: ..., features: [...] },
      where 'layer' is metadata of layer related to identification result, features is array
      containing (GeoJSON feature-objects)[http://geojson.org/geojson-spec.html#feature-objects]
      or a promise returning such array.
      @private
    */
    _identify(e) {
      let shouldIdentify = Ember.A(e.layers || []).contains(this.get('layerModel'));
      if (!shouldIdentify) {
        return;
      }

      // Call public identify method, if layer should be identified.
      e.results.push({
        layerModel: this.get('layerModel'),
        features: this.identify(e)
      });
    },

    /**
      Handles 'flexberry-map:search' event of leaflet map.

      @method search
      @param {Object} e Event object.
      @param {<a href="http://leafletjs.com/reference-1.0.0.html#latlng">L.LatLng</a>} e.latlng Center of the search area.
      @param {Object[]} layerModel Object describing layer that must be searched.
      @param {Object} searchOptions Search options related to layer type.
      @param {Object} results Hash containing search results.
      @param {Object[]} results.features Array containing (GeoJSON feature-objects)[http://geojson.org/geojson-spec.html#feature-objects]
      or a promise returning such array.
    */
    _search(e) {
      let shouldSearch = typeof (e.filter) === 'function' && e.filter(this.get('layerModel'));
      if (!shouldSearch) {
        return;
      }

      // Call public search method, if layer should be searched.
      e.results.push({
        layerModel: this.get('layerModel'),
        features: this.search(e)
      });
    },

    /**
     Handles 'flexberry-map:query' event of leaflet map.

     @method query
     @param {Object} e Event object.
     @param {Object} queryFilter Object with query filter parameters
     @param {Object} mapObjectSetting Object describing current query setting
     @param {Object[]} results Objects describing query results.
     Every result-object has the following structure: { layer: ..., features: [...] },
     where 'layer' is metadata of layer related to query result, features is array
     containing (GeoJSON feature-objects)[http://geojson.org/geojson-spec.html#feature-objects]
     or a promise returning such array.
   */
    _query(e) {
      // Filter current layer links by setting.
      let layerLinks =
        this.get('layerModel.layerLink')
          .filter(link => link.get('mapObjectSetting.id') === e.mapObjectSetting);

      if (!Ember.isArray(layerLinks) || layerLinks.length === 0) {
        return;
      }

      // Call public query method, if layer has links.
      e.results.push({
        layerModel: this.get('layerModel'),
        features: this.query(layerLinks, e)
      });
    },

    /**
      Returns leaflet layer's bounding box.

      @method _getBoundingBox
      @private
      @return <a href="http://leafletjs.com/reference-1.1.0.html#latlngbounds">L.LatLngBounds</a>
    */
    _getBoundingBox() {
      assert('BaseLayer\'s \'_getBoundingBox\' should be overridden.');
    },

    /**
      Initializes component.
    */
    init() {
      this._super(...arguments);

      // Create leaflet layer.
      this._createLayer();
    },

    /**
      Initializes DOM-related component's properties.
    */
    didInsertElement() {
      this._super(...arguments);

      // Wait for the layer creation to be finished and set it's state related to actual settings.
      this.get('_leafletLayerPromise').then((leafletLayer) => {
        this._setLayerState();
      });

      let leafletMap = this.get('leafletMap');
      if (!Ember.isNone(leafletMap)) {
        // Attach custom event-handler.
        leafletMap.on('flexberry-map:identify', this._identify, this);
        leafletMap.on('flexberry-map:search', this._search, this);
        leafletMap.on('flexberry-map:query', this._query, this);
      }
    },

    /**
      Deinitializes DOM-related component's properties.
    */
    willDestroyElement() {
      this._super(...arguments);

      let leafletMap = this.get('leafletMap');
      if (!Ember.isNone(leafletMap)) {
        // Detach custom event-handler.
        leafletMap.off('flexberry-map:identify', this._identify, this);
        leafletMap.off('flexberry-map:search', this._search, this);
        leafletMap.off('flexberry-map:query', this._query, this);
      }

      // Destroy leaflet layer.
      this._destroyLayer();
    },

    /**
      Creates leaflet layer related to layer type.

      @method createLayer
      @returns <a href="http://leafletjs.com/reference-1.0.1.html#layer">L.Layer</a>|<a href="https://emberjs.com/api/classes/RSVP.Promise.html">Ember.RSVP.Promise</a>
      Leaflet layer or promise returning such layer.
    */
    createLayer() {
      assert('BaseLayer\'s \'createLayer\' should be overridden.');
    },

    /**
      Identifies layer's objects inside specified bounding box.

      @method identify
      @param {Object} e Event object.
      @param {<a href="http://leafletjs.com/reference-1.0.0.html#rectangle">L.Rectangle</a>} e.boundingBox Leaflet layer
      representing bounding box within which layer's objects must be identified.
      @param {<a href="http://leafletjs.com/reference-1.0.0.html#latlng">L.LatLng</a>} e.latlng Center of the bounding box.
      @param {Object[]} layers Objects describing those layers which must be identified.
      @param {Object[]} results Objects describing identification results.
      Every result-object has the following structure: { layer: ..., features: [...] },
      where 'layer' is metadata of layer related to identification result, features is array
      containing (GeoJSON feature-objects)[http://geojson.org/geojson-spec.html#feature-objects]
      or a promise returning such array.
    */
    identify(e) {
      assert('BaseLayer\'s \'identify\' method should be overridden.');
    },

    /**
      Handles 'flexberry-map:search' event of leaflet map.

      @method search
      @param {Object} e Event object.
      @param {<a href="http://leafletjs.com/reference-1.0.0.html#latlng">L.LatLng</a>} e.latlng Center of the search area.
      @param {Object[]} layer Object describing layer that must be searched.
      @param {Object} searchOptions Search options related to layer type.
      @param {Object} results Hash containing search results.
      @param {Object[]} results.features Array containing (GeoJSON feature-objects)[http://geojson.org/geojson-spec.html#feature-objects]
      or a promise returning such array.
    */
    search(e) {
      assert('BaseLayer\'s \'search\' method should be overridden.');
    },

    /**
      Handles 'flexberry-map:query' event of leaflet map.

      @method _query
      @param {Object[]} layerLinks Array containing metadata for query
      @param {Object} e Event object.
      @param {Object} queryFilter Object with query filter paramteres
      @param {Object[]} results.features Array containing leaflet layers objects
      or a promise returning such array.
    */
    query(layerLinks, e) {
      assert('BaseLayer\'s \'query\' method should be overridden.');
    },

    /**
      Returns leaflet layer's bounding box.

      @method getBoundingBox
      @return <a href="http://leafletjs.com/reference-1.1.0.html#latlngbounds">L.LatLngBounds</a>
    */
    getBoundingBox() {
      let layer = this.get('_leafletObject');

      if (Ember.isNone(layer)) {
        return new Ember.RSVP.Promise((resolve, reject) => {
          reject(`Leaflet layer for '${this.get('layerModel.name')}' isn't created yet`);
        });
      }

      let bounds = this._getBoundingBox(layer);

      return bounds;
    },

    /**
      Observes and handles changes in layer's properties marked as leaflet options.
      Performs layer's recreation with new options.
      Note: it is overridden method from 'leaflet-options' mixin.

      @method leafletOptionsDidChange
      @param {String[]} changedOptions Array containing names of all changed options.
    */
    leafletOptionsDidChange({
      changedOptions
    }) {
      let optionsDidntChange = changedOptions.length === 0;
      if (optionsDidntChange) {
        // Prevent unnecessary leaflet layer's recreation.
        return;
      }

      let onlyOpacityDidChange = changedOptions.length === 1 && changedOptions.contains('opacity');
      if (onlyOpacityDidChange) {
        // Prevent unnecessary leaflet layer's recreation.
        return;
      }

      // Destroy previously created leaflet layer (created with old settings).
      this._destroyLayer();

      // Create new leaflet layer (with new settings).
      this._createLayer();

      // Wait for the layer creation to be finished and set it's state related to new settings.
      this.get('_leafletLayerPromise').then((leafletLayer) => {
        this._setLayerState();
      });
    },

    /**
      Injects (leafelt GeoJSON layers)[http://leafletjs.com/reference-1.0.0.html#geojson] according to current CRS
      into specified (GeoJSON)[http://geojson.org/geojson-spec] feature, features, or featureCollection

      @method injectLeafletLayersIntoGeoJSON
      @param {Object} geojson (GeoJSON)[http://geojson.org/geojson-spec] feature, features, or featureCollection.
      @param {Object} [options] Options of (leafelt GeoJSON layer)[http://leafletjs.com/reference-1.0.0.html#geojson].
      @return (leafelt GeoJSON layer)[http://leafletjs.com/reference-1.0.0.html#geojson].
    */
    injectLeafletLayersIntoGeoJSON(geojson, options) {
      geojson = geojson || {};
      options = options || {};

      let featureCollection = {
        type: 'FeatureCollection',
        features: []
      };

      if (Ember.isArray(geojson)) {
        Ember.set(featureCollection, 'features', geojson);
      } else if (Ember.get(geojson, 'type') === 'Feature') {
        Ember.set(featureCollection, 'features', [geojson]);
      } else if (Ember.get(geojson, 'type') === 'FeatureCollection') {
        featureCollection = geojson;
      }

      let features = Ember.A(Ember.get(featureCollection, 'features') || []);
      if (Ember.get(features, 'length') === 0) {
        return null;
      }

      let crs = this.get('crs');
      Ember.set(options, 'coordsToLatLng', function (coords) {
        let point = new L.Point(coords[0], coords[1]);
        let latlng = crs.projection.unproject(point);
        if (!Ember.isNone(coords[2])) {
          latlng.alt = coords[2];
        }

        return latlng;
      });

      // Define callback method on each feature.
      let originalOnEachFeature = Ember.get(options, 'onEachFeature');
      Ember.set(options, 'onEachFeature', function (feature, leafletLayer) {
        // Remember layer inside feature object.
        Ember.set(feature, 'leafletLayer', leafletLayer);

        // Call user-defined 'onEachFeature' callback.
        if (Ember.typeOf(originalOnEachFeature) === 'function') {
          originalOnEachFeature(feature, leafletLayer);
        }
      });

      // Perform conversion & injection.
      return new L.GeoJSON(featureCollection, options);
    }
  }
);
