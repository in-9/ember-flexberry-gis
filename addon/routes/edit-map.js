/**
  @module ember-flexberry-gis
*/

import Ember from 'ember';
import EditFormRoute from 'ember-flexberry/routes/edit-form';
import {
  Query
} from 'ember-flexberry-data';

/**
  Edit map route.
  Loads map project & related layers hierarchy.

  @class MapRoute
  @extends EditFormRoute
*/
export default EditFormRoute.extend({
  queryParams: {
    setting: {
      refreshModel: false,
      replace: false,
      as: 'setting'
    },
    geofilter: {
      refreshModel: false,
      replace: false,
      as: 'geofilter'
    }
  },

  /**
    Name of CSW connection model projection to be used as record's properties limitation.

    @property cswConnectionProjection
    @type String
    @default 'MapE'
  */
  cswConnectionProjection: 'CswConnectionE',

  /**
    Name of CSW connection model to be used as form's record type.

    @property modelName
    @type String
    @default 'new-platform-flexberry-g-i-s-csw-connection'
  */
  cswConnectionModelName: 'new-platform-flexberry-g-i-s-csw-connection',

  /**
    Loaded CSW connections.

    @property cswConnections
    @type Object[]
    @default null
  */
  cswConnections: null,

  /**
    Name of model projection to be used as record's properties limitation.

    @property modelProjection
    @type String
    @default 'MapE'
  */
  modelProjection: 'MapE',

  /**
    Name of model to be used as form's record type.

    @property modelName
    @type String
    @default 'new-platform-flexberry-g-i-s-map'
  */
  modelName: 'new-platform-flexberry-g-i-s-map',

  /**
    Loads available CSW connections.

    @method loadCswConnections
    @param {Object} params Query parameters.
    @return {<a href="http://emberjs.com/api/classes/RSVP.Promise.html">Ember.RSVP.Promise</a>}
    Promise which will return available CSW connections after it will be resolved.
  */
  loadCswConnections(params) {
    let store = this.get('store');
    let modelName = this.get('cswConnectionModelName');

    let query = new Query.Builder(store)
      .from(modelName)
      .selectByProjection(this.get('cswConnectionProjection'));

    return store.query(modelName, query.build()).then((cswConnections) => {
      this.set('cswConnections', cswConnections.toArray());
    });
  },

  /**
    [Model hook](http://emberjs.com/api/classes/Ember.Route.html#method_model) that returns a map project for current route.

    @method model
    @param {Object} params
    @param {Object} transition
    @return {<a href="http://emberjs.com/api/classes/RSVP.Promise.html">Ember.RSVP.Promise</a>}
    Promise which will return map project related to current route
  */
  model(params) {
    this.loadCswConnections(params);
    return this._super(...arguments);
  },

  /**
    Setups controller for the current route.
    [More info](http://emberjs.com/api/classes/Ember.Route.html#method_setupController).

    @method setupController
    @param {Ember.Controller} controller
    @param {Object} model
  */
  setupController(controller, model) {
    this._super(...arguments);
    let layers = model.get('mapLayer').filter(layer => Ember.isEmpty(layer.get('parent')));

    if (layers) {
      model.set('hierarchy', this.sortLayersByIndex(layers));
    }

    controller.set('cswConnections', this.get('cswConnections'));
  },

  sortLayersByIndex(layers) {
    let result = layers;
    if (result) {
      result = result.sortBy('index').reverse();
      result.forEach((item) => {
        if (Ember.isArray(item.get('layers'))) {
          item.set('layers', this.sortLayersByIndex(item.get('layers')));
        }
      }, this);
    }

    return result;
  }
});
