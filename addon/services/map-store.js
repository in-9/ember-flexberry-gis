import Ember from 'ember';

import { Query } from 'ember-flexberry-data';

const {
  Builder
} = Query;

const defaultMapName = 'defaultOSMMap';

export default Ember.Service.extend({
  store: Ember.inject.service(),

  _mapModelName: 'new-platform-flexberry-g-i-s-map',

  _layerModelname: 'new-platform-flexberry-g-i-s-map-layer',

  _defaultModelProjName: 'MapE',

  defaultOSMMap: null,

  init() {
    this._super(...arguments);
    this.setupCustomMaps();
  },

  setupCustomMaps() {
    let store = this.get('store');
    let mapModel = store.createRecord(this._mapModelName, {
      name: defaultMapName,
      lat: 0,
      lng: 0,
      zoom: 0,
      public: true,
        coordinateReferenceSystem: '{"code":"EPSG:4326"}'
    });
    let openStreetMapLayer = store.createRecord(this._layerModelname, {
      name: 'OSM',
      type: 'tile',
      visibility: true,
      index: 0,
      coordinateReferenceSystem: '{"code":"EPSG:3857","definition":null}',
      settings: '{"opacity": 1, "url":"http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}'
    });
    mapModel.get('mapLayer').pushObject(openStreetMapLayer);
    this.set('defaultOSMMap', mapModel);
  },

  getMapById(mapId, modelProjName) {
    modelProjName = Ember.isNone(modelProjName) ? this._defaultModelProjName : modelProjName;
    let store = this.get('store');
    let builder = new Builder(store)
    .from(this._mapModelName)
    .selectByProjection(modelProjName)
    .byId(mapId);
    let ret = store.queryRecord(this._mapModelName, builder.build());
    return ret;
  }

});
