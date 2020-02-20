import Ember from 'ember';
import turfCombine from 'npm:@turf/combine';

export default Ember.Mixin.create({

  /**
    Change layer object properties.

    @method changeLayerObjectProperties
    @param {string} layerId Layer id.
    @param {string} featureId Object id.
    @param {Object} properties Object properties.
    @return {Object} featureLayer.
  */
  changeLayerObjectProperties(layerId, featureId, properties) {
    return new Ember.RSVP.Promise((resolve, reject) => {
      this._getModelLayerFeature(layerId, featureId, load = true).then(([, leafletObject, featureLayer]) => {
        Object.assign(featureLayer.feature.properties, properties);
        leafletObject.editLayer(featureLayer);
        resolve(featureLayer);
      }).catch((e) => {
        reject(e);
      });
    });
  },

  /**
    Start change layer object.

    @method startChangeLayerObject
    @param {string} layerId Layer id.
    @param {string} featureId Object id.
    @return {Object} Feature layer.
  */
  startChangeLayerObject(layerId, featureId) {
    return new Ember.RSVP.Promise((resolve, reject) => {
      this._getModelLayerFeature(layerId, featureId).then(([layerModel, leafletObject, featureLayer]) => {
        let leafletMap = this.get('mapApi').getFromApi('leafletMap');
        leafletMap.fitBounds(featureLayer.getBounds());
        let layers = leafletObject._layers;
        let featureLayerLoad = Object.values(layers).find(feature => {
          const layerFeatureId = this._getLayerFeatureId(layerModel, feature);
          return layerFeatureId === featureId;
        });

        let editTools = this._getEditTools();

        featureLayerLoad.enableEdit(leafletMap);
        featureLayerLoad.layerId = layerId;

        editTools.on('editable:editing', (e) => {
          if (Ember.isEqual(Ember.guidFor(e.layer), Ember.guidFor(featureLayerLoad))) {
            leafletObject.editLayer(e.layer);
          }
        });

        resolve(featureLayerLoad);
      }).catch((e) => {
        reject(e);
      });
    });
  },

  /**
    Cancel edit for layer object.

    @method cancelEdit
    @param {Object} layer layer object.
    @return nothing
  */
  cancelEdit(layer) {
    let leafletMap = this.get('mapApi').getFromApi('leafletMap');
    let editTools = this._getEditTools();
    this.disableLayerEditing(leafletMap);
    editTools.off('editable:drawing:end');
    editTools.off('editable:editing');
    editTools.stopDrawing();
    editTools.featuresLayer.clearLayers();
    editTools.editLayer.clearLayers();

    if (!Ember.isNone(layer.layerId)) {
      let [, leafletObject] = this._getModelLayerFeature(layer.layerId);
      if (!Ember.isNone(leafletObject)) {
        if (layer.state === leafletObject.state.insert) {
          leafletObject.removeLayer(layer);
        } else if (layer.state === leafletObject.state.update) {
          let map = Ember.get(leafletObject, '_map');
          map.removeLayer(layer);
          let filter = new L.Filter.EQ('primarykey', Ember.get(layer, 'feature.properties.primarykey'));
          let feature = leafletObject.loadFeatures(filter);

          let id = leafletObject.getLayerId(layer);
          if (id in leafletObject.changes) {
            delete leafletObject.changes[id];
            delete leafletObject._layers[id];
          }
        }
      }

      layer.layerId = null;
    }
  },

  /**
    Start visual creating of feature

    @param {String} layerId Id of layer in that should started editing
    @param {Object} properties New layer properties
    @returns noting
  */
  startNewObject(layerId, properties) {
    let [layerModel, leafletObject] = this._getModelLayerFeature(layerId);
    let editTools = this._getEditTools();
    let newLayer;

    let finishDraw = () => {
      editTools.off('editable:drawing:end', finishDraw, this);
      editTools.stopDrawing();
      let defaultProperties = layerModel.get('settingsAsObject.defaultProperties') || {};
      newLayer.feature = { properties: Ember.merge(defaultProperties, properties) };
      leafletObject.addLayer(newLayer);
    };

    editTools.on('editable:drawing:end', finishDraw, this);

    let leafletMap = this.get('mapApi').getFromApi('leafletMap');
    leafletMap.fire('flexberry-map:switchToDefaultMapTool');
    if (editTools.drawing()) {
      editTools.stopDrawing();
    }

    switch (layerModel.get('settingsAsObject.typeGeometry').toLowerCase()) {
      case 'polygon':
        newLayer = editTools.startPolygon();
        break;
      case 'polyline':
        newLayer = editTools.startPolyline();
        break;
      case 'marker':
        newLayer = editTools.startMarker();
        break;
      default:
        throw 'Unknown layer type: ' + layerModel.get('settingsAsObject.typeGeometry');
    }

    newLayer.layerId = layerId;
    return newLayer;
  },

  /**
    Get editTools.

    @method _getEditTools
    @return {Object} EditTools.
    @private
  */
  _getEditTools() {
    let leafletMap = this.get('mapApi').getFromApi('leafletMap');
    let editTools = Ember.get(leafletMap, 'editTools');
    if (Ember.isNone(editTools)) {
      editTools = new L.Editable(leafletMap);
      Ember.set(leafletMap, 'editTools', editTools);
    }

    return editTools;
  },

  /**
    Return leaflet layer thats corresponds to passed layerId.

    @method _getLeafletLayer
    @param {String} layerId
    @returns {Object}
    @private
  */
  getLayerModel(layerId) {
    const layer = this.get('mapLayer').findBy('id', layerId);
    if (Ember.isNone(layer)) {
      throw `Layer '${layerId}' not found`;
    }

    return layer;
  },

  /**
    Get [layerModel, leafletObject, featureLayer] by layer id or layer id and object id.

    @param {string} layerId Layer id.
    @param {string} [featureId] Object id.
    @returns {[layerModel, leafletObject, featureLayer]} Get [layerModel, leafletObject, featureLayer] or [layerModel, leafletObject, undefined].
    @private
  */
  _getModelLayerFeature(layerId, featureId, load = false) {
    return new Ember.RSVP.Promise((resolve, reject) => {
      let layerModel = this.getLayerModel(layerId);
      if (Ember.isNone(layerModel)) {
        reject(`Layer '${layerId}' not found`);
      }
      let leafletObject = layerModel.get('_leafletObject');
      if (!Ember.isNone(featureId)) {
        if (load) {
          this.loadFeaturesOfLayer(layerId, [featureId]).then((leafletObject) => {
            let layers = leafletObject._layers;
            let featureLayer = Object.values(layers).find(feature => {
              const layerFeatureId = this._getLayerFeatureId(layerModel, feature);
              return layerFeatureId === featureId;
            });
            if (Ember.isNone(featureLayer)) {
              reject(`Object '${featureId}' not found`);
            } else {
              resolve([layerModel, leafletObject, featureLayer]);
            }
          });
        } else {
          this.getFeaturesOfLayer(layerId, [featureId]).then((featureLayer) => {
            if (Ember.isE(featureLayer)) {
              reject(`Object '${featureId}' not found`);
            } else {
              resolve([layerModel, leafletObject, featureLayer[0]]);
            }
          });
        }
      }

      resolve([layerModel, leafletObject, undefined]);
    });
  },

  /**
    Start creating multy objects.

    @method startChangeMultyLayerObject
    @param {string} layerId Layer id.
    @param {Object} featureLayer Feature layer.
  */
  startChangeMultyLayerObject(layerId, featureLayer) {
    let [layerModel, leafletObject] = this._getModelLayerFeature(layerId);

    let editTools = this._getEditTools();
    let newLayer;
    featureLayer.layerId = layerId;

    const disableDraw = () => {
      editTools.off('editable:drawing:end', disableDraw, this);
      editTools.stopDrawing();

      var featureCollection = {
        type: 'FeatureCollection',
        features: [featureLayer.toGeoJSON(), newLayer.toGeoJSON()]
      };

      // Coordinate union.
      let fcCombined = turfCombine.default(featureCollection);
      const featureCombined = L.geoJSON(fcCombined);
      const combinedLeaflet = featureCombined.getLayers()[0];
      featureLayer.setLatLngs(combinedLeaflet.getLatLngs());
      featureLayer.disableEdit();
      featureLayer.enableEdit();
      editTools.featuresLayer.clearLayers();

      // We note that the shape was edited.
      leafletObject.editLayer(featureLayer);
    };

    editTools.on('editable:drawing:end', disableDraw, this);

    switch (layerModel.get('settingsAsObject.typeGeometry').toLowerCase()) {
      case 'polygon':
        newLayer = editTools.startPolygon();
        break;
      case 'polyline':
        newLayer = editTools.startPolyline();
        break;
      case 'marker':
        newLayer = editTools.startMarker();
        break;
      default:
        throw 'Unknown layer type: ' + layerModel.get('settingsAsObject.typeGeometry');
    }
  }

});
