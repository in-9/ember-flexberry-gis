import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('flexberry-add-marker', 'Integration | Component | flexberry add marker', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{flexberry-add-marker}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#flexberry-add-marker}}
      template block text
    {{/flexberry-add-marker}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});