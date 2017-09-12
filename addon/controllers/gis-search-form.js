/**
  @module ember-flexberry-gis
*/

import Ember from 'ember';

/**
  GIS search form controller.

  @class GisSearchFormController
  @extends <a href="http://emberjs.com/api/classes/Ember.Controller.html">Ember.Controller</a>
*/
export default Ember.Controller.extend({
  /**
    Model for search panel.
  */
  searchConditions: {
    /**
      Comma-separated list of key words. Used for search.

      @property searchConditions.searchKeyWords
      @type String
      @default null
    */
    keyWords: null,

    /**
      Left boundary of scale limitation.

      @property searchConditions.scaleFrom
      @type Number
      @default null
    */
    scaleFrom: null,

    /**
      Right boundary of scale limitation.

      @property searchConditions.scaleTo
      @type Number
      @default null
    */
    scaleTo: null,

    /**
      Min longitude value. Used for search.

      @property searchConditions.minLng
      @type Number
      @default null
    */
    minLng: null,

    /**
      Min latitude value. Used for search.

      @property searchConditions.minLat
      @type Number
      @default null
    */
    minLat: null,

    /**
      Max longitude value. Used for search.

      @property searchConditions.maxLng
      @type Number
      @default null
    */
    maxLng: null,

    /**
      Max latitude value. Used for search.

      @property searchConditions.maxLat
      @type Number
      @default null
    */
    maxLat: null
  },

  /**
    Indicates - when to show error message.

    @property showFormErrorMessage
    @readOnly
  */
  showFormErrorMessage: Ember.computed('error', function () {
    if (this.get('error')) {
      return true;
    } else {
      return false;
    }
  }),

  /**
    Hash with ids of selected rows.
  */
  selectedRows: {},

  /**
    The route name to transit when user clicks 'open a map'.
  */
  mapRouteName: '',

  actions: {
    /**
      Handles search button click and passes search data to the route.

      @method actions.getSearchResults
    */
    getSearchResults() {
      let req = { searchConditions: this.get('searchConditions') };
      this.set('selectedRows', {}); // clear selected rows
      this.send('doSearch', req);
    },

    /**
      Handles action from child table component.

      @method actions.getData
      @param {String} field Path to property in which loaded data must be stored.
      @param {Object} data Hash object containing paging and filtering data.
    */
    getData(field, data) {
      let req = Ember.$().extend(data, {
        searchConditions: this.get('searchConditions'),
        fieldName: field
      });
      this.send('doSearch', req);
    },

    /**
      Handles click on 'open map' button.

      @method actions.goToMap
      @param {Object} mapModel Model of the map to transition
    */
    goToMap(mapModel) {
      // may be it should pass event.ctrlKey
      this.transitToMap(mapModel);
    },

    /**
      Handles click on row select checkbox.

      @param {String} rowId Id of selected row.
      @param {Object} options Event options. We condider options.checked.
    */
    onRowSelect(rowId, options) {
      let selected = this.get('selectedRows');
      selected[rowId] = options.checked;
      this.set('selectedRows', selected);
    }
  },

  /**
    Handles transition to selected map.

    @method transitToMap
    @param {Object} mapModel Model of the map to transition
  */
  transitToMap(mapModel) {
    let mapRoute = this.get('mapRouteName');
    Ember.assert(`The parameter 'mapRouteName' shouldn't be empty!`, !Ember.isNone(mapRoute));
    this.transitionToRoute(mapRoute, mapModel.get('object'));
  },
});
