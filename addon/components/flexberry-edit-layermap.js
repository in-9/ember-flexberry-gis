import Ember from 'ember';
import RequiredActionsMixin from '../mixins/required-actions';
import DynamicActionsMixin from '../mixins/dynamic-actions';
import DynamicPropertiesMixin from '../mixins/dynamic-properties';
import layout from '../templates/components/flexberry-edit-layermap';
import {
  translationMacro as t
} from 'ember-i18n';

// Proj4 CRS code.
// Will be initialized in 'init' method.
let proj4CrsCode = null;
/**
  Component's CSS-classes names.
  JSON-object containing string constants with CSS-classes names related to component's .hbs markup elements.

  @property {Object} flexberryClassNames
  @property {String} flexberryClassNames.prefix Component's CSS-class names prefix ('flexberry-edit-layer-dialog').
  @property {String} flexberryClassNames.wrapper Component's wrapping <div> CSS-class name (null, because component is tagless).
  @readonly
  @static

  @for FlexberryEditLayerDialogComponent
*/
const flexberryClassNamesPrefix = 'flexberry-edit-layermap';
const flexberryClassNames = {
  prefix: flexberryClassNamesPrefix,
  wrapper: null
};

export default Ember.Component.extend(
  RequiredActionsMixin,
  DynamicActionsMixin,
  DynamicPropertiesMixin, {
    /**
      Dialog's 'type' dropdown caption.

      @property typeDropdownCaption
      @type String
      @default t('components.layers-dialogs.edit.type-dropdown.caption')
    */
    typeDropdownCaption: t('components.layers-dialogs.edit.type-dropdown.caption'),

    /**
      Dialog's 'name' textbox caption.

      @property nameTextboxCaption
      @type String
      @default t('components.layers-dialogs.edit.name-textbox.caption')
    */
    nameTextboxCaption: t('components.layers-dialogs.edit.name-textbox.caption'),

    /**
      Reference to component's CSS-classes names.
      Must be also a component's instance property to be available from component's .hbs template.
    */
    flexberryClassNames,

    /**
      Overridden ['tagName'](http://emberjs.com/api/classes/Ember.Component.html#property_tagName)
      is empty to disable component's wrapping <div>.

      @property tagName
      @type String
      @default ''
    */
    tagName: '',

    /**
      Component's additional CSS-class names.

      @property class
      @type String
      @default null
    */
    class: null,

    /**
      Dialog's 'CRS' segment caption.

      @property crsCaption
      @type String
      @default t('components.layers-dialogs.edit.crs.caption')
    */
    crsCaption: t('components.layers-dialogs.edit.crs.caption'),

    /**
      Dialog's 'CRS' segment's name textbox caption.

      @property crsNameTextboxCaption
      @type String
      @default t('components.layers-dialogs.edit.crs.name-textbox.caption')
    */
    crsNameTextboxCaption: t('components.layers-dialogs.edit.crs.name-textbox.caption'),

    /**
      Dialog's 'CRS' segment's code textbox caption.

      @property crsCodeTextboxCaption
      @type String
      @default t('components.layers-dialogs.edit.crs.code-textbox.caption')
    */
    crsCodeTextboxCaption: t('components.layers-dialogs.edit.crs.code-textbox.caption'),

    /**
      Dialog's 'CRS' segment's definition textarea caption.

      @property crsDefinitionTextareaCaption
      @type String
      @default t('components.layers-dialogs.edit.crs.definition-textarea.caption')
    */
    crsDefinitionTextareaCaption: t('components.layers-dialogs.edit.crs.definition-textarea.caption'),

    /**
      Flag: indicates whether layer type is in readonly mode.

      @property _typeIsReadonly
      @type Boolean
      @default true
      @private
    */
    _typeIsReadonly: false,

    /**
      Hash containing editing layer.

      @property layer
      @type Object
      @default null
    */
    layer: null,

    /**
      User friendly coordinate reference system (CRS) code.
      For example 'ESPG:4326'.

      @property _coordinateReferenceSystemCode
      @type String
      @default null
      @private
    */
    _coordinateReferenceSystemCode: null,

    /**
      Available modes.

      @property _availableModes
      @type Object[]
      @default null
      @private
    */
    _availableModes: null,

    /**
      Selected mode.

      @property _selectedModeCaption
      @type String
      @default null
      @private
    */
    _selectedModeCaption: null,

    /**
      Flag: indicates whether dialog is visible or not.
      If true, then dialog will be shown, otherwise dialog will be closed.

      @property visible
      @type Boolean
      @default false
    */
    visible: true,

    /**
      Array containing available layers types.

      @property _availableTypes
      @type String[]
      @default null
      @private
    */
    _availableTypes: null,

    /**
      Inner hash containing editing layer.

      @property layer
      @type Object
      @default null
    */
    _layer: null,

    /**
      Inner hash containing type-related settings mapped by available layer types.

      @property _settings
      @type Object
      @default null
      @private
    */
    _settings: null,

    /**
      Inner hash containing coordinate reference systems settings mapped by available codes.

      @property _coordinateReferenceSystems
      @type Object
      @default null
      @private
    */
    _coordinateReferenceSystems: null,

    /**
      Array containing user friendly coordinate reference systems (CRS) codes.
      For example ['ESPG:4326', 'PROJ4'].

      @property _availableCoordinateReferenceSystemsCodes
      @type String[]
      @default null
      @private
    */
    _availableCoordinateReferenceSystemsCodes: null,

    /**
      Tabular menu containing tabs items.

      @property _$tabularMenu
      @type Object
      @default null
      @private
    */
    _$tabularMenu: null,
    
    /**
      Tabular menu active tab name.

      @property _tabularMenuActiveTab
      @type String
      @private
    */
    _tabularMenuActiveTab: 'main',

    /**
      Leaflet map.
    
      @property leafletMap
      @type <a href="http://leafletjs.com/reference-1.0.0.html#map">L.Map</a>
      @default null
    */
    leafletMap: null,

    /**
      Flag: indicates whether coordinate reference system (CRS) edit fields must be shown.

      @property _availableCoordinateReferenceSystemsCodes
      @type Boolean
      @readonly
    */
    _showCoordinateReferenceSystemFields: Ember.computed('_coordinateReferenceSystemCode', function () {
      return this.get('_coordinateReferenceSystemCode') === proj4CrsCode;
    }),

    /**
      Creates inner hash containing layer CRS settings for different CRS codes.

      @method _createInnerCoordinateReferenceSystems
      @private
    */
    _createInnerCoordinateReferenceSystems() {
      let coordinateReferenceSystems = {};
      Ember.A(this.get('_availableCoordinateReferenceSystemsCodes') || []).forEach((code) => {
        coordinateReferenceSystems[code] = {
          code: code === proj4CrsCode ? null : code,
          definition: null
        };
      });

      this.set('_coordinateReferenceSystems', coordinateReferenceSystems);
    },

    /**
      Creates inner hash containing layer settings for different layer types.

      @method _createInnerSettings
      @private
    */
    _createInnerSettings() {
      let settings = {};
      Ember.A(this.get('_availableTypes') || []).forEach((type) => {
        let layerClassFactory = Ember.getOwner(this).knownForType('layer', type);
        settings[type] = layerClassFactory.createSettings();
      });

      this.set('_settings', settings);
    },

    /**
      Destroys inner hash containing layer settings.

      @method _destroyInnerSettings
      @private
    */
    _destroyInnerSettings() {
      this.set('_settings', null);
    },

    /**
      Creates inner hash containing layer copy.

      @method _createInnerLayer
      @private
    */
    _createInnerLayer() {
      let type = this.get('layer.type');
      let name = this.get('layer.name');

      let crs = this.get('layer.coordinateReferenceSystem');
      crs = Ember.isNone(crs) ? {} : JSON.parse(crs);

      let crsCode = Ember.get(crs, 'code');
      if (!Ember.isBlank(crsCode) && !this.get('_availableCoordinateReferenceSystemsCodes').contains(crsCode)) {
        // Unknown CRS code means that proj4 is used.
        crsCode = proj4CrsCode;
      }

      this.set('_coordinateReferenceSystemCode', crsCode);

      this._createInnerCoordinateReferenceSystems();
      this.set(`_coordinateReferenceSystems.${crsCode}`, crs);

      let settings = this.get('layer.settings');
      let defaultSettings = Ember.isNone(type) ? {} : Ember.getOwner(this).knownForType('layer', type).createSettings();
      if (!Ember.isNone(settings)) {
        settings = Ember.$.extend(true, defaultSettings, JSON.parse(settings));
      } else if (!Ember.isNone(type)) {
        settings = defaultSettings;
      }
      
      this._createInnerSettings();
      if (!Ember.isNone(settings)) {
        this.set(`_settings.${type}`, settings);
      }

      this.set('_layer', {
        type: type,
        name: name,
        coordinateReferenceSystem: crs,
        settings: settings,
      });
    },

    /**
      Destroys inner hash containing layer copy.

      @method _destroyInnerLayer
      @private
    */
    _destroyInnerLayer() {
      this.set('_layer', null);
      this._destroyInnerSettings();
    },

    /**
      Resets tabuler menu.

      @method _resetTabularMenu
      @private
    */
    _resetTabularMenu() {
      let $tabularMenu = this.get('_$tabularMenu');
      if (!Ember.isNone($tabularMenu)) {
        Ember.$('.tab.item', $tabularMenu).tab();
      }
    },

    /**
      Observes visibility changes & creates/destroys inner hash containing layer copy.

      @method _visibleDidChange
      @private
    */
    _visibleDidChange: Ember.on('init', Ember.observer('visible', 'settings', 'name', 'coordinateReferenceSystem', function () {
      if (this.get('visible') || this.get('visible')===undefined) {
        this._createInnerLayer();
      } else {
        this._destroyInnerLayer();
      }
    })),

    /**
      Observes type changes & changes link to object containing type-related settings.

      @method _innerLayerTypeDidChange
      @private
    */
    _innerLayerTypeDidChange: Ember.observer('_layer.type', function () {
      if (Ember.isNone(this.get('_layer'))) {
        return;
      }

      let type = this.get('_layer.type');
      this.set('_layer.settings', this.get(`_settings.${type}`));
    }),

    /**
      Observes _coordinateReferenceSystemCode changes & changes link to object containing code-related CRS settings.

      @method _coordinateReferenceSystemCodeDidChange
      @private
    */
    _coordinateReferenceSystemCodeDidChange: Ember.observer('_coordinateReferenceSystemCode', function () {
      if (Ember.isNone(this.get('_layer'))) {
        return;
      }

      let code = this.get('_coordinateReferenceSystemCode');
      this.set('_layer.coordinateReferenceSystem', this.get(`_coordinateReferenceSystems.${code}`));
    }),

    /**
      Initializes component.
    */
    init() {
      this._super(...arguments);
      // Retrieve & remember constant (proj4 CRS code).
      let proj4CrsFactory = Ember.getOwner(this).knownForType('coordinate-reference-system', 'proj4');
      proj4CrsCode = Ember.get(proj4CrsFactory, 'code');

      // Available layers types for related dropdown.
      let owner = Ember.getOwner(this);
      this.set('_availableTypes', owner.knownNamesForType('layer'));

      // Available CRS codes for related dropdown.
      let crsFactories = owner.knownForType('coordinate-reference-system');
      let crsFactoriesNames = owner.knownNamesForType('coordinate-reference-system');
      this.set('_availableCoordinateReferenceSystemsCodes', Ember.A(crsFactoriesNames.map((crsFactoryName) => {
        let crsFactory = Ember.get(crsFactories, crsFactoryName);
        return Ember.get(crsFactory, 'code');
      })));

      let availableEditModes = Ember.A();

      let editModesNames = owner.knownNamesForType('edit-mode');
      editModesNames.forEach((modeName) => {
        let editModeFactory = owner.knownForType('edit-mode', modeName);
        let isAvailable = editModeFactory.componentCanBeInserted(this);
        if (isAvailable) {
          availableEditModes.pushObject(editModeFactory);
        }
      });

      this.set('_availableModes', availableEditModes);
      this.sendAction('layerProperties', this.getLayerProperties.bind(this));
    },

    getLayerProperties() {
           
      let layer = this.get('_layer');
      let coordinateReferenceSystem = Ember.get(layer, 'coordinateReferenceSystem');
      coordinateReferenceSystem = Ember.$.isEmptyObject(coordinateReferenceSystem) ? null : JSON.stringify(coordinateReferenceSystem);
      Ember.set(layer, 'coordinateReferenceSystem', coordinateReferenceSystem);

      let settings = Ember.get(layer, 'settings');
      settings = Ember.$.isEmptyObject(settings) ? null : JSON.stringify(settings);
      Ember.set(layer, 'settings', settings);
      
      return layer;
    },

    /**
      Flag: indicates whether CRS is available for the selected layer type.

      @property _crsSettingsAreAvailableForType
      @type Boolean
      @private
      @readonly
    */
    _crsSettingsAreAvailableForType: Ember.computed('_layer.type', function () {
      let className = this.get('_layer.type');

      let available = Ember.getOwner(this).isKnownNameForType('layer', className) && className !== 'group';
      if (!available && this.get('_tabularMenuActiveTab') === 'crs') {
        this.set('_tabularMenuActiveTab', 'main');
      }

      // Reset tabular menu after tab has been added or removed.
      Ember.run.scheduleOnce('afterRender', this, '_resetTabularMenu');

      return available;
    }),

    /**
      Flag: indicates whether type-related settings are available for the selected layer type.

      @property _layerSettingsAreAvailableForType
      @type Boolean
      @private
      @readonly
    */
    _layerSettingsAreAvailableForType: Ember.computed('_layer.type', function () {
      let className = this.get('_layer.type');

      let available = Ember.getOwner(this).isKnownNameForType('layer', className) && className !== 'group';
      if (!available && this.get('_tabularMenuActiveTab') === 'settings') {
        this.set('_tabularMenuActiveTab', 'main');
      }

      // Reset tabular menu after tab has been added or removed.
      Ember.run.scheduleOnce('afterRender', this, '_resetTabularMenu');

      return available;
    }),

    /**
      Flag: indicates whether 'identify' operation settings are available for the selected layer type.

      @property _identifySettingsAreAvailableForType
      @type Boolean
      @private
      @readonly
    */
    _identifySettingsAreAvailableForType: Ember.computed('_layer.type', function () {
      let className = this.get('_layer.type');
      let layerClass = Ember.getOwner(this).knownForType('layer', className);

      let available = !Ember.isNone(layerClass) && Ember.A(Ember.get(layerClass, 'operations') || []).contains('identify');
      if (!available && this.get('_tabularMenuActiveTab') === 'identifySettings') {
        this.set('_tabularMenuActiveTab', 'main');
      }

      // Reset tabular menu after tab has been added or removed.
      Ember.run.scheduleOnce('afterRender', this, '_resetTabularMenu');

      return available;
    }),

    /**
      Flag: indicates whether 'search' operation settings are available for the selected layer type.

      @property _searchSettingsAreAvailableForType
      @type Boolean
      @private
      @readonly
    */
    _searchSettingsAreAvailableForType: Ember.computed('_layer.type', function () {
      let className = this.get('_layer.type');
      let layerClass = Ember.getOwner(this).knownForType('layer', className);

      let available = !Ember.isNone(layerClass) && Ember.A(Ember.get(layerClass, 'operations') || []).contains('search');
      if (!available && this.get('_tabularMenuActiveTab') === 'searchSettings') {
        this.set('_tabularMenuActiveTab', 'main');
      }

      // Reset tabular menu after tab has been added or removed.
      Ember.run.scheduleOnce('afterRender', this, '_resetTabularMenu');

      return available;
    }),

    /**
      Flag: indicates whether 'display' operation settings are available for the selected layer type.

      @property _displaySettingsAreAvailableForType
      @type Boolean
      @private
      @readonly
    */
    _displaySettingsAreAvailableForType: Ember.computed('_layer.type', function () {
      return true;
    }),

    /**
      Flag: indicates whether 'legend' operation settings are available for the selected layer type.

      @property _legendSettingaAreAvailableForType
      @type Boolean
      @private
      @readonly
    */
    _legendSettingaAreAvailableForType: Ember.computed('_layer.type', function () {
      let className = this.get('_layer.type');
      let layerClass = Ember.getOwner(this).knownForType('layer', className);

      let available = !Ember.isNone(layerClass) && Ember.A(Ember.get(layerClass, 'operations') || []).contains('legend');
      if (!available && this.get('_tabularMenuActiveTab') === 'legendSettings') {
        this.set('_tabularMenuActiveTab', 'main');
      }

      // Reset tabular menu after tab has been added or removed.
      Ember.run.scheduleOnce('afterRender', this, '_resetTabularMenu');

      return available;
    }),

    /**
      Available modes captions.

      @property _availableModesCaptions
      @type String[]
      @readonly
    */
    _availableModesCaptions: Ember.computed('_availableModes', 'i18n', function () {
      let _availableModes = this.get('_availableModes');

      let modes = Ember.A();
      if (Ember.isArray(_availableModes) && _availableModes.length !== 0) {
        let i18n = this.get('i18n');

        modes.pushObject(i18n.t('components.layers-dialogs.edit-modes.new'));

        modes.pushObjects(_availableModes.map((editMode) => {
          return i18n.t('components.layers-dialogs.edit-modes.' + editMode.name);
        }));
      }

      return modes;
    }),

    /**
      Flag: indicates whether modes are available.

      @property _modesAreAvailable
      @type Boolean
      @readonly
    */
    _modesAreAvailable: Ember.computed('_availableModes', function () {
      let _availableModes = this.get('_availableModes');

      return Ember.isArray(_availableModes) && !Ember.isBlank(_availableModes);
    }),

    /**
      Selected mode.

      @property _selectedMode
      @type Object
      @readonly
    */
    _selectedMode: Ember.computed('_selectedModeCaption', function () {
      let _availableModes = this.get('_availableModes');
      let _availableModesCaptions = this.get('_availableModesCaptions');
      let _selectedModeCaption = this.get('_selectedModeCaption');

      if (!Ember.isArray(_availableModes) || !Ember.isArray(_availableModesCaptions) || Ember.isBlank(_selectedModeCaption)) {
        return null;
      }

      let modeIndex = _availableModesCaptions.findIndex(item => item.string === _selectedModeCaption) - 1;

      return modeIndex > -1 ? _availableModes.objectAt(modeIndex) : null;
    }),

    /**
      Initializes component's DOM-related properties.
    *//*
    didInsertElement() {
      this._super(...arguments);

      let $tabularMenu = this.get('childViews')[0].$('.tabular.menu');
      this.set('_$tabularMenu', $tabularMenu);
    },*/

    /**
      Deinitializes component's DOM-related properties.
    */
    willDestroyElement() {
      this._super(...arguments);

      let $tabularMenu = this.get('_$tabularMenu');
      if (!Ember.isNone($tabularMenu)) {
        Ember.$('.tab.item', $tabularMenu).tab('destroy');
        this.set('_$tabularMenu', null);
      }
    },

  actions: {
    /**
      Handles {{#crossLink "BaseEditModeComponent/sendingActions.editingFinished:method"}}'base-edit-mode' components 'editingFinished' action {{/crossLink}}.

      @method actions.onEditingFinished
      @param {Object} layer Modified layer model
    */
    onEditingFinished(layer) {
      let _layerHash = this.get('_layer');

      for (var propertyName in layer) {
        if (layer.hasOwnProperty(propertyName) && _layerHash.hasOwnProperty(propertyName)) {
          Ember.set(_layerHash, propertyName, Ember.get(layer, propertyName));
        }
      }

      this.set('_layer', _layerHash);
      this.set('_coordinateReferenceSystemCode', Ember.get(_layerHash, 'coordinateReferenceSystem.code'));
    },

    /**
      Handles clicks on tabs.

      @method actions.onTabClick
      @param {Object} e Click event object.
    */
    onTabClick(e) {
      e = Ember.$.event.fix(e);

      let $clickedTab = Ember.$(e.currentTarget);
      let clickedTabName = $clickedTab.attr('data-tab');
      this.set('_tabularMenuActiveTab', clickedTabName);
    },
  },
  
  layout
});

Ember.Component.reopenClass({
  flexberryClassNames
});
