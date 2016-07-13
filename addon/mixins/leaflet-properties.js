import Ember from 'ember';

export default Ember.Mixin.create({
  leafletProperties: [],

  _addObservers() {
    this._observers = {};
    let layer = this.get('_layer');
    this.get('leafletProperties').forEach(propExp => {

      let [property, leafletProperty, ...params] = propExp.split(':');
      if (!leafletProperty) { leafletProperty = 'set' + Ember.String.classify(property); }
      let objectProperty = property.replace(/\.\[]/, ''); //allow usage of .[] to observe array changes

      this._observers[property] = function() {
        let value = this.get(objectProperty);
        Ember.assert(this.constructor + ' must have a ' + leafletProperty + ' function.', !!layer[leafletProperty]);
        let propertyParams = params.map(p => this.get(p));
        layer[leafletProperty].call(layer, value, ...propertyParams);
      };

      this.addObserver(property, this, this._observers[property]);
    });
  },

  _removeObservers() {
    if (this._observers) {
      this.get('leafletProperties').forEach(propExp => {

        let [property] = propExp.split(':');

        this.removeObserver(property, this, this._observers[property]);
        delete this._observers[property];
      });
    }
  }
});
