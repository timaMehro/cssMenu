/**
 * Plugin to handle mini cart
 */

(function ($) {

  'use strict';

  var pluginName = 'miniCart',
    namespace = 'plugin_' + pluginName;

  /**
   * The Plugin constructor
   * @constructor
   * @param {HTMLElement} element The element that will be monitored
   */
  function Plugin(element) {
    this.miniCart = $(element);
    this.pageOverlay = $('.page__overlay');
    this.body = $('body');
    this.cartItemCountElements = $('.cart-icon-wrapper__count');

    this._init();
  }

  Plugin.prototype._init = function() {
    if (Modernizr.touchevents) {
      bouncefix.add('mini-cart__header');
      bouncefix.add('mini-cart__items');
      bouncefix.add('mini-cart__footer');
    }

    var headerHeight = $('.header__wrapper').height() + 1 + 'px',
      self = this;

    this.miniCart.find('.mini-cart__header').css({height: headerHeight, 'min-height': headerHeight});

    this.body.on('click', '[data-action="open-mini-cart"]', $.proxy(this.toggleMiniCart, this));
    this.miniCart.on('click', '[data-action="close-mini-cart"]', $.proxy(this.toggleMiniCart, this));
    this.miniCart.on('click', '[data-action="remove-product"]', $.proxy(this.removeProduct, this));

    // The product pages allow to asynchronously add product to the mini-cart. We listen to the event "cart_updated" to update the mini-cart
    $(document).on('product.added', $.proxy(this.productAdded, this));

    // When the page is initially loaded, we re-load the mini-cart to fix a potential issue with Ajax and back buttons on some browsers
    $.ajax('/cart?view=mini-cart-content').then(function(cartContent) {
      self._rerenderMiniCart(cartContent);
    });
  };

  Plugin.prototype.toggleMiniCart = function() {
    var self = this;

    setTimeout(function() {
      var boundingTopRect = $('.header__wrapper')[0].getBoundingClientRect().top;

      self.miniCart.css('margin-top', boundingTopRect);

      // On mobile, because we now allow the informational top bar to be displayed, we need to do additional calculation
      // to ensure the full mini-cart is visible
      if (Modernizr.mq('(max-width: 499px)')) {
        self.miniCart.find('.mini-cart__content')
          .css('max-height', (self.miniCart.height() - self.miniCart.find('.mini-cart__header').height() - boundingTopRect) + 'px');
      }

      if (self.miniCart.hasClass('mini-cart--open')) {
        self.closeMiniCart();
      } else {
        self.openMiniCart();
      }
    }, 50);

    return false;
  };

  Plugin.prototype.openMiniCart = function() {
    this.miniCart.addClass('mini-cart--open');
    this.pageOverlay.addClass('page__overlay--open');
    this.pageOverlay.one('click', $.proxy(this.closeMiniCart, this));
    this.body.addClass('no-scroll');
  };

  Plugin.prototype.closeMiniCart = function() {
    this.miniCart.removeClass('mini-cart--open');
    this.pageOverlay.removeClass('page__overlay--open').off('click');
    this.body.removeClass('no-scroll');
  };

  Plugin.prototype.productAdded = function() {
    var self = this;

    // If the cart is configured to be a drawer, we open the mini-cart directly
    

    
  };

  Plugin.prototype.removeProduct = function(event) {
    var item = $(event.currentTarget).closest('.mini-cart__item'),
      lineItem = item.attr('data-index'),
      self = this;

    this.miniCart.addClass('mini-cart--reloading');

    $.post({
      url: '/cart/change.js',
      dataType: 'json',
      data: {
        quantity: 0,
        line: parseInt(lineItem)
      }
    }).then(function() {
      $.ajax('/cart?view=mini-cart-content').then(function(cartContent) {
        item.slideUp(150, function() {
          self._rerenderMiniCart(cartContent);
        });
      });
    });

    return false;
  };

  Plugin.prototype._rerenderMiniCart = function(content) {
    var newMiniCartContent = $(content);

    if (Modernizr.touchevents) {
      bouncefix.remove('mini-cart__items');
      bouncefix.remove('mini-cart__footer');
    }

    if (newMiniCartContent.hasClass('mini-cart__empty')) {
      $('.cart-icon-wrapper--has-items').hide();
      $('.cart-icon-wrapper--empty').show();
    } else {
      $('.cart-icon-wrapper--has-items').show();
      $('.cart-icon-wrapper--empty').hide();
      this.cartItemCountElements.text(newMiniCartContent.attr('data-item-count'));
    }

    // It has re-rendered, we can remove the class
    this.miniCart.find('.mini-cart__content').html(newMiniCartContent);
    this.miniCart.removeClass('mini-cart--reloading');

    if (Modernizr.touchevents) {
      bouncefix.add('mini-cart__items');
      bouncefix.add('mini-cart__footer');
    }

    
  };

  $.fn[pluginName] = function(options) {
    var method = false,
      methodArgs = arguments;

    if (typeof options == 'string') {
      method = options;
    }

    return this.each(function() {
      var plugin = $.data(this, namespace);

      if (!plugin && !method) {
        $.data(this, namespace, new Plugin(this, options));
      } else if (method) {
        callMethod(plugin, method, Array.prototype.slice.call(methodArgs, 1));
      }
    });
  };
}(jQuery));
/**
 * Plugin to handle navigation sidebar
 */

(function ($) {

  'use strict';

  var pluginName = 'navigationSidebar',
    namespace = 'plugin_' + pluginName;

  /**
   * The Plugin constructor
   * @constructor
   * @param {HTMLElement} element The element that will be monitored
   */
  function Plugin(element) {
    this.navigationSidebar = $(element);
    this.navigationSidebarCurrent = this.navigationSidebar.find('.navigation-sidebar__current-title');
    this.pageOverlay = $('.page__overlay');
    this.body = $('body');

    this._init();
  }

  Plugin.prototype._init = function() {
    this.navigationSidebar.find('.navigation-sidebar__top').css('height', $('.header__wrapper').height() + 1 + 'px');

    if (Modernizr.touchevents) {
      bouncefix.add('navigation-sidebar__header');
      bouncefix.add('navigation-sidebar__list');
    }

    $('body').on('click', '[data-action="open-navigation-sidebar"], [data-action="close-navigation-sidebar"]', $.proxy(this.toggleNavigationSidebar, this));

    $('[data-action="rewind-navigation-sidebar"]').on('click', $.proxy(this.rewindNavigationSidebar, this));
    this.navigationSidebar.find('.navigation-sidebar__item--expandable > .navigation-sidebar__link').on('click', $.proxy(this.openNextLevel, this));
  };

  Plugin.prototype.toggleNavigationSidebar = function(event) {
    var topMargin = $('.header__wrapper')[0].getBoundingClientRect().top;

    this.navigationSidebar.toggleClass('navigation-sidebar--open');
    this.navigationSidebar.css('margin-top', topMargin);
    this.pageOverlay.toggleClass('page__overlay--open');
    this.body.toggleClass('no-scroll');

    if (this.navigationSidebar.hasClass('navigation-sidebar--open')) {
      // This allows to fix an issue on Safari where the list may not be focused
      this.navigationSidebar.one('transitionend webkitTransitionEnd oTransitionEnd', function() {
        $('.navigation-sidebar__list--active').focus();
      });

      this.pageOverlay.one('click', $.proxy(this.closeNavigationSidebar, this));
    } else {
      this.pageOverlay.off('click');
    }

    return false;
  };

  Plugin.prototype.closeNavigationSidebar = function(event) {
    this.navigationSidebar.removeClass('navigation-sidebar--open');
    this.pageOverlay.removeClass('page__overlay--open').off('click');
    this.body.removeClass('no-scroll');
  };

  Plugin.prototype.openNextLevel = function(event) {
    var element = $(event.currentTarget),
      currentLevel = element.closest('.navigation-sidebar__list'),
      subNav = element.attr('data-open-nav'),
      nextLevel = this.navigationSidebar.find('[data-nav-for="' + subNav + '"]');

    // We need to take the next nav, and push it
    nextLevel.addClass('navigation-sidebar__list--active').attr('data-parent-nav', currentLevel.attr('data-nav-for'));
    currentLevel.addClass('navigation-sidebar__list--hidden');

    $('[data-action="close-navigation-sidebar"]').hide();
    $('[data-action="rewind-navigation-sidebar"]').show();

    this.navigationCurrentLevel = nextLevel;
    this.navigationSidebarCurrent.text(nextLevel.attr('data-nav-name'));

    return false;
  };

  Plugin.prototype.rewindNavigationSidebar = function(event) {
    var parentLevel = this.navigationSidebar.find('[data-nav-for="' + this.navigationCurrentLevel.attr('data-parent-nav') + '"]');

    this.navigationCurrentLevel.removeClass('navigation-sidebar__list--active');
    parentLevel.removeClass('navigation-sidebar__list--hidden');

    // If the current navigation level is 1, this means that the next one is 0, so we show again the cross
    if (parentLevel.attr('data-nav-for') === 'main-menu') {
      $('[data-action="close-navigation-sidebar"]').show();
      $('[data-action="rewind-navigation-sidebar"]').hide();
      this.navigationSidebarCurrent.text('');
    } else {
      this.navigationSidebarCurrent.text(parentLevel.attr('data-nav-name'));
    }

    this.navigationCurrentLevel = parentLevel;

    return false;
  };

  $.fn[pluginName] = function(options) {
    var method = false,
      methodArgs = arguments;

    if (typeof options == 'string') {
      method = options;
    }

    return this.each(function() {
      var plugin = $.data(this, namespace);

      if (!plugin && !method) {
        $.data(this, namespace, new Plugin(this, options));
      } else if (method) {
        callMethod(plugin, method, Array.prototype.slice.call(methodArgs, 1));
      }
    });
  };
}(jQuery));
/**
 * Plugin to handle tabs
 */

(function ($) {

  'use strict';

  var pluginName = 'product',
    namespace = 'plugin_' + pluginName;

  /**
   * The Plugin constructor
   * @constructor
   * @param {HTMLElement} element The element that will be monitored
   * @param {Object} options
   */
  function Plugin(element, options) {
    this.element = $(element);
    this.options = options;
    this.product = this.options['product'];
    this.singleOptionSelectors = this.element.find('.single-option-selector');
    this.masterSelector = this.element.find('#product-select-' + this.product['id']);
    this.currentVariant = this._getVariantFromOptions();

    this._init();

    var self = this;

    $(document).on('shopify:section:load', function(event) {
      self.element = $('#product-' + self.options['product']['id']);
      self._init();
    });
  }

  Plugin.prototype._init = function() {
    console.log("aa");
    this.singleOptionSelectors.on('change', $.proxy(this._onSelectorChanged, this));

    // We hook into the "add to cart" button to asynchronously add the product
    this.element.find('[data-action="add-to-cart"]').on('click', $.proxy(this._addToCart, this));

    // In Kagami, the label appears inside the selector box. In order to achieve this, we must use JavaScript to calculate the width of the label
    // and applying a padding on the values. We cannot do that in pure Liquid as the width of a text depends on the characters used and the font
    for (var i = 0 ; i !== this.product['options'].length ; ++i) {
      var selector = $('#single-option-selector-' + i);
      selector.css('padding-left', 28 + selector.next('.option-selector__label').outerWidth() + 'px');
    }
  };

  /**
   * ---------------------------------------------------------------------------------------------------
   * CODE THAT HANDLE VARIANT CHANGES IN THE FRONT
   * ---------------------------------------------------------------------------------------------------
   */

  /**
   * Whenever the variant changes, we have several things to update: the slideshow image, the prices,
   * the labels...
   */
  Plugin.prototype._onVariantChanged = function(previousVariant, newVariant) {
    var productMeta = this.element.find('.product-meta'),
      productMetaPrices = productMeta.find('.product-meta__prices'),
      productMetaLabels = productMeta.find('.product-meta__labels'),
      addToCartButton = this.element.find('.product__add-to-cart');

    // For the various meta, as they depend on the variant status, we always remove them to start with
    productMeta.find('.product-meta__price, .label:not(.label--custom)').remove();

    // Okay, we have a lot of things to do. First, let's check if we have a valid variant
    if (newVariant) {
      // If the variant is not available, it's just a sold out
      if (!newVariant['available']) {
        addToCartButton.removeClass('button--primary').addClass('button--secondary').attr('disabled', 'disabled').text(window.languages.soldOutLabel);
        productMetaLabels.append('<span class="label label--sold-out">' + window.languages.soldOutLabel + '</span>');
        $('.back-in-stock').show();
        $('#notify_button').attr('data-variant-id',newVariant.id);
      } else {
        addToCartButton.removeClass('button--secondary').addClass('button--primary').removeAttr('disabled').text(window.languages.addToCartLabel);
        $('.back-in-stock').hide();
        $('#notify_button').attr('data-variant-id','');

        // Otherwise, the product could be on sale
        if (newVariant['compare_at_price'] > newVariant['price']) {
          productMetaPrices.before('<span class="product-meta__price product-meta__price--new" data-money-convertible>' + Shopify.formatMoney(newVariant['price'], window.shop['moneyFormat']) + '</span>');
          productMetaPrices.before('<span class="product-meta__price product-meta__price--old" data-money-convertible>' + Shopify.formatMoney(newVariant['compare_at_price'], window.shop['moneyFormat']) + '</span>');
        } else {
          productMetaPrices.before('<span class="product-meta__price" data-money-convertible>' + Shopify.formatMoney(newVariant['price'], window.shop['moneyFormat']) + '</span>');
        }
      }

      // If there is a special image, we need to change the featured image in the slideshow
      if (newVariant['featured_image']) {
        if (this.options['context'] === 'main') {
          var productSlideshow = this.element.find('.product__slideshow'),
            productSlideshowImages = productSlideshow.find('.product__slideshow-slide');
        } else {
          var productSlideshow = this.element.find('.quick-shop__slideshow'),
            productSlideshowImages = productSlideshow.find('.product__slideshow-slide');
        }

        var itemToFind = productSlideshowImages.filter('[data-image-id="' + newVariant['featured_image']['id'] + '"]');

        productSlideshow.slick('slickGoTo', itemToFind.attr('data-index'));
      }
    } else {
      // This is an unavailable variant, so we need to disable the add to cart button and replace the price by
      // an unavailable label
      addToCartButton.removeClass('button--primary').addClass('button--secondary').attr('disabled', 'disabled').text(window.languages.unavailableLabel);
    }

    

    // Just to let other people a way to add behaviour
    $(document).trigger('variant.changed', newVariant);
  };

  /**
   * This call back is called whenever a property in one of the select or radio button has changed
   */
  Plugin.prototype._onSelectorChanged = function() {
    var previousVariant = this.currentVariant;

    this.currentVariant = this._getVariantFromOptions();
    this._onVariantChanged(previousVariant, this.currentVariant);

    if (this.currentVariant) {
      if (this.options['enableHistoryState']) {
        this._updateHistoryState(this.currentVariant);
      }

      // We need to modify the hidden select that contain the id attribute as well
      this.masterSelector.find('[selected]').removeAttr('selected');
      this.masterSelector.find('[value="' + this.currentVariant['id'] + '"]').attr('selected', 'selected');
    }

    // We also trigger an event so that other system can hookup and perform additional changes
    $(document).trigger('variant.changed', this.currentVariant);
  };

  /**
   * Update the HTML history state
   */
  Plugin.prototype._updateHistoryState = function(variant) {
    if (!history.replaceState) {
      return;
    }

    var newUrl = window.location.protocol + '//' + window.location.host + window.location.pathname + '?variant=' + variant.id;
    window.history.replaceState({path: newUrl}, '', newUrl);
  };

  Plugin.prototype._addToCart = function(event) {
    var productForm = this.element.find('.product__form'),
      addToCartButton = productForm.find('.product__add-to-cart');

    addToCartButton.text(window.languages.addingToCartButton);
    addToCartButton.attr('disabled', 'disabled');

    $.post({
      url: '/cart/add.js',
      data: productForm.serialize(),
      dataType: 'json'
    }).then(function(result) {
      addToCartButton.removeAttr('disabled');

      
        addToCartButton.text(window.languages.addedToCartButton);

        // We restore original button message after 2 seconds
        setTimeout(function() {
          addToCartButton.text(window.languages.addToCartButton);
        }, 2000);
      

      // We throw an event so that our mini-cart can do additional processing like re-rendering the mini-cart
      $(document).trigger('product.added');
    }).catch(function(error) {
      addToCartButton.text(error.responseJSON.description);

      // We restore original button message after 2 seconds
      setTimeout(function() {
        addToCartButton.text(window.languages.addToCartButton);
        addToCartButton.removeAttr('disabled');
      }, 2000);
    });

    event.preventDefault();
  };

  /**
   * Get the variant that is currently selected
   */
  Plugin.prototype._getVariantFromOptions = function() {
    var selectedValues = this._getCurrentOptions();
    var variants = this.product['variants'];
    var found = false;

    variants.forEach(function(variant) {
      var satisfied = true;

      selectedValues.forEach(function(option) {
        if (satisfied) {
          satisfied = (option.value === variant[option.index]);
        }
      });

      if (satisfied) {
        found = variant;
      }
    });

    return found || null;
  };

  /**
   * Extract all the current options
   */
  Plugin.prototype._getCurrentOptions = function() {
    var currentOptions = this.singleOptionSelectors.toArray().map(function(element) {
      var $element = $(element),
        type = $element.attr('type'),
        index = $element.attr('data-option-index');

      if (type === 'radio' || type === 'checkbox') {
        if ($element[0].checked) {
          return {value: $element.val(), index: index};
        } else {
          return false;
        }
      } else {
        return {value: $element.val(), index: index};
      }
    });

    // remove any unchecked input values if using radio buttons or checkboxes

    return currentOptions.filter(function(item) {
      return item;
    });
  };

  $.fn[pluginName] = function(options) {
    var method = false,
      methodArgs = arguments;

    if (typeof options == 'string') {
      method = options;
    }

    return this.each(function() {
      var plugin = $.data(this, namespace);

      if (!plugin && !method) {
        $.data(this, namespace, new Plugin(this, options));
      } else if (method) {
        callMethod(plugin, method, Array.prototype.slice.call(methodArgs, 1));
      }
    });
  };
}(jQuery));
/**
 * JQuery Pick (used to display related products)
 */
(function( $ ){
  $.fn.pick = function(count) {

    var howMany = count || 4;

    // Picking random numbers without repeating.
    var index_array = [];
    var original_obj_size = this.length;
    for (var i=0; i<original_obj_size; i++) {
      index_array.push(i);
    }
    //+ Jonas Raoni Soares Silva
    //@ http://jsfromhell.com/array/shuffle [rev. #1]
    var shuffle = function(v) {
      for (var j, x, i = v.length; i; j = parseInt(Math.random() * i), x = v[--i], v[i] = v[j], v[j] = x);
      return v;
    };
    var new_index_array = shuffle(index_array).slice(0,howMany);

    // Ditching unpicked elements and removing those from the returned set.
    return this.each(function(i) {
      if ($.inArray(i,new_index_array) === -1) {
        $(this).remove();
      } else {
        var image = $(this).find('img');
        image.attr('src', image.attr('data-src'));
      }
    }).filter(function() {
      if (this.parentNode === null) {
        return false;
      }
      else {
        return true;
      }
    });

  };
})( jQuery );
/**
 * Plugin to handle auto-completion
 */

(function ($) {
  var methods = {
    /**
     * Init the plugin
     */
    init: function() {
      var element = $(this),
          wrapper = element.find('.header__search-wrapper');

      element.find('[data-action="open-search"]').on('click', function() {
        element.addClass('header__item-search--expanded').closest('.header__wrapper').addClass('header__wrapper--search');

        wrapper.one('transitionend webkitTransitionEnd oTransitionEnd', function() {
          element.find('.search__input').focus();
        });

        return false;
      });

      element.find('[data-action="close-search"]').on('click', function() {
        element.removeClass('header__item-search--expanded header__item-search--active').closest('.header__wrapper').removeClass('header__wrapper--search');

        return false;
      });

      element.find('.search__input').awesomecomplete({
        resultLimit: 50,
        typingDelay: 150,
        suggestionListClass: 'autocomplete__results',
        itemClass: 'autocomplete__result',
        activeItemClass: 'autocomplete__result--active',
        splitTerm: false,
        attachTo: $('.autocomplete'),
        wrapSuggestions: true,

        dataMethod: function(term, event, done) {
          element.addClass('header__item-search--active');

          $.ajax({
            url: '/search',
            dataType: 'json',
            data: {
              q: term + '*',
              view: 'json',
              type: "product,article,page"
            }
          }).then(function(data) {
            done(data);
          });
        },

        sortFunction: function() {
          return 0;
        },

        renderFunction: function(result, term) {
          if (result['results_count'] !== undefined) {
            if (result['results_count'] === 0) {
              return '<p class="autocomplete__no-results">' + window.languages.autocompleteNoResults + '</p>';
            } else {
              return '<a href="' + result['url'] + '" class="button button--primary">' + window.languages.autocompleteSeeAll + " (" + result['results_count'] + ")</a>";
            }
          } else {
            var html =  '';
            
            if (result['object_type'] === 'product') {
              html = html + '<img src="' + result['image'] + '" class="autocomplete__image">'
            }
            
            html = html + '<div class="autocomplete__info ' + (result['price_min'] === null ? 'autocomplete__info--page' : '') + '">';

            if (result['vendor']) {
              html += '<span class="autocomplete__subheading">' + result['vendor'] + '</span>';
            }

            if (result['blog']) {
              html += '<span class="autocomplete__subheading">' + result['blog'] + '</span>';
            }

            html += '<span class="autocomplete__heading">' + result['title'] + '</span>';

            if (result['object_type'] === 'product') {
              var priceMin = result['price_min'],
                currentCurrency = window.Currency.currentCurrency,
                format = window.shop.moneyFormat;

              

              priceMin = Shopify.formatMoney(priceMin, format);

              html += '<span class="autocomplete__price" data-money-convertible>' + priceMin + "</span>";
            }

            html += '</div>';

            return html;
          }
        },

        onComplete: function(dataItem) {
          location.href = dataItem['url'];
        }
      });
    }
  };

  $.fn.searchAutocomplete = function(options) {
    return methods.init.call(this, options);
  };
}(jQuery));

/**
 * Plugin to handle tabs
 */

(function ($) {

  'use strict';

  var pluginName = 'tabs',
    namespace = 'plugin_' + pluginName;

  /**
   * The Plugin constructor
   * @constructor
   * @param {HTMLElement} element The element that will be monitored
   */
  function Plugin(element) {
    this.element = $(element);
    this.tabsNav = this.element.find('.tabs__nav-item');
    this.tabsContent = this.element.find('.tabs__content');
    this.tabsNavLine = this.element.find('.tabs__nav-line');

    this.tabsNav.on('click', $.proxy(this.switchTab, this));

    var self = this;

    $(document).on('shopify:block:select', function(event) {
      $('html, body').animate({
        scrollTop: ($(event.target).offset().top - $('.header').height()) + 'px'
      }, 'fast');

      self.switchTab(event);
    });
  }

  Plugin.prototype.switchTab = function(event) {
    var currentTab = $(event.target),
      currentTabIndex = currentTab.attr('data-tab-index');
console.log(currentTab);
    currentTab.addClass('tabs__nav-item--active').siblings().removeClass('tabs__nav-item--active');
    this.tabsContent.find('.tabs__content-item').removeClass('tabs__content-item--active').eq(currentTabIndex).addClass('tabs__content-item--active');

    // Let's now move the magic line
    this.tabsNavLine.css({
      left: (currentTab.offset().left - this.tabsNav.first().offset().left),
      width: currentTab.width()
    });

    event.stopPropagation();
  };

  Plugin.prototype.destroy = function() {
    this.tabsNav.off('click');
  };

  $.fn[pluginName] = function(options) {
    var method = false,
      methodArgs = arguments;

    if (typeof options == 'string') {
      method = options;
    }

    return this.each(function() {
      var plugin = $.data(this, namespace);

      if (!plugin && !method) {
        $.data(this, namespace, new Plugin(this, options));
      } else if (method) {
        callMethod(plugin, method, Array.prototype.slice.call(methodArgs, 1));
      }
    });
  };
}(jQuery));
var router = new RouterRouter();

router.route('account/addresses', function() {
  /**
   * -------------------------
   * MODALS
   * -------------------------
   */

  $('[data-action="open-new-address-modal"]').on('click', function(e) {
    var instance = $('.addresses__new').remodal({});
    instance.open();

    e.preventDefault();
  });

  $('[data-action="open-edit-address-modal"]').on('click', function(e) {
    var instance = $('.addresses__edit[data-address="' + $(this).attr('data-address') + '"]').remodal({});
    instance.open();

    e.preventDefault();
  });
});
router.route('*all', function() {
  var isMobile = Modernizr.mq('(max-width: 500px)');

  /**
   * -------------------------
   * STICKY HEADER POLYFILL
   * -------------------------
   */

  (function() {
    var headerSection = $('#shopify-section-header');

    Stickyfill.add(headerSection.get(0));
    $('.anchor').css('top', -headerSection.height());

    $(document).on('shopify:section:unload', '#shopify-section-header', function(event) {
      Stickyfill.remove(event.target);
    });

    $(document).on('shopify:section:load', '#shopify-section-header', function(event) {
      Stickyfill.add(event.target);
    });
  }());

  /**
   * ----------------------------
   * SEARCH
   * ----------------------------
   */

  (function() {
    $('.header__item-search').searchAutocomplete();

    $(document).on('shopify:section:load', '#shopify-section-header', function(event) {
      $(event.target).find('.header__item-search').searchAutocomplete();
    });
  }());

  /**
   * ----------------------------
   * NAVIGATION SIDEBAR
   * ----------------------------
   */

  (function() {
    $('.navigation-sidebar').navigationSidebar();
  }());

  /**
   * ----------------------------
   * MINI-CART
   * ----------------------------
   */

  

  /**
   * ----------------------------
   * HORIZONTAL NAVIGATION
   * ----------------------------
   */

  (function() {
    /**
     * ----------------------------
     * HORIZONTAL NAV
     * ----------------------------
     */

    $('.navigation-horizontal__list-item--expandable > .navigation-horizontal__list-link').on('click', function() {
      var element = $(this),
        item = element.closest('.navigation-horizontal__list-item');

      item.toggleClass('navigation-horizontal__list-item--active');
      item.siblings().removeClass('navigation-horizontal__list-item--active')
        .find('.navigation-horizontal__dropdown-item--active').removeClass('navigation-horizontal__dropdown-item--active');

      $(document).on('click', function(e) {
        if ($(e.target).closest('.navigation-horizontal').length === 0) {
          item.removeClass('navigation-horizontal__list-item--active');
          item.find('.navigation-horizontal__dropdown-item--active').removeClass('navigation-horizontal__dropdown-item--active');

          $(document).off('click');
        }
      });

      return false;
    });

    $('.navigation-horizontal__dropdown-item--expandable > .navigation-horizontal__dropdown-link').on('click', function() {
      var element = $(this),
        item = element.closest('.navigation-horizontal__dropdown-item');

      item.toggleClass('navigation-horizontal__dropdown-item--active');
      item.siblings().removeClass('navigation-horizontal__dropdown-item--active');

      return false;
    });

    var dropdownImageContainer = $('.navigation-horizontal__image');

    $('.dropdown-column__list-link[data-src]').on('mouseenter', function() {
      dropdownImageContainer.attr('src', $(this).attr('data-src'));
    });
  }());

  /**
   * -------------------------
   * AUTOMATIC CURRENCY CONVERSION
   * -------------------------
   */

  (function() {
    
  })();

  /**
   * -------------------------
   * FEATURED COLLECTIONS (COLLAGE)
   * -------------------------
   */

  (function() {
    var initCollectionsCollage = function(collections) {
      collections.finalTilesGallery({
        margin: isMobile ? 10 : 25,
        gridSize: 20,
        minTileWidth: isMobile ? 180 : Math.min(window.innerWidth - 25, 350),
        imageSizeFactor: [
          [2000, .5],
          [1024, .45],
          [480, .4]
        ]
      });
    };

    initCollectionsCollage($('.list-collections--collage'));

    $(document).on('shopify:section:load', function(event) {
      var collections = $(event.target).find('.list-collections--collage');

      if (collections.length > 0) {
        initCollectionsCollage(collections);
      }
    });
  })();

  /**
   * -------------------------
   * FEATURED PRODUCTS (COLLAGE)
   * -------------------------
   */

  (function() {
    var initProductsCollage = function(products) {
      var options = {
        margin: isMobile ? 10 : 25,
        gridSize: 15,
        minTileWidth: isMobile ? 180 : Math.min(window.innerWidth - 25, 325),
        imageSizeFactor: [
          [2000, .6],
          [1024, .5],
          [480, .35]
        ]
      };

      if (products.attr('data-infinite-scroll-url')) {
        options['autoLoadURL'] = products.attr('data-infinite-scroll-url');
        options['loadingTarget'] = '.collection__loader';
        options['onAutoLoaded'] = function(html) {
          return $(html).find('.ftg-items').children();
        };
        options['onAutoLoadCompleted'] = function() {
          $('.collection__loader').remove();
        };
      }

      products.finalTilesGallery(options);
    };

    initProductsCollage($('.collection--collage'));

    $(document).on('shopify:section:load', function(event) {
      var products = $(event.target).find('.collection--collage');

      if (products.length > 0) {
        initProductsCollage(products);
      }
    });
  })();

  /**
   * ----------------------------
   * QUICK SHOP
   * ----------------------------
   */

  (function() {
    var quickShopModal = $('.quick-shop'),
      quickShopRemodalInstance = quickShopModal.remodal({hashTracking: false});

    $('body').on('click', '[data-action="open-quick-shop"]', function(event) {
      quickShopRemodalInstance.open();

      $.ajax($(this).attr('data-quick-shop-url')).then(function(result) {
        quickShopModal.html(result);
        
        $('#sizing-guide').on('click', function(e) {
          e.preventDefault();
          $('.sizing-chart').html($('.size-chart').html()).prepend('<button data-remodal-action="close" class="remodal-close">X</button>');
          $('.sizing-chart').remodal().open();
        });

        
      });

      window.quickShopRemodalInstance = quickShopRemodalInstance;

      event.preventDefault();
    });

    // When the modal is closed we need to re-add the small spinner
    $(document).on('closed', '.quick-shop', function() {
      quickShopModal.html('<div class="quick-shop__spinner spinner-container spinner-container--large"><div class="spinner spinner--circle"></div></div>');
      window.quickShopRemodalInstance = null;
    });
  }());

  /**
   * -------------------------
   * ADD THE SMALL CSS EFFECT WHEN HOVERING GRID ITEM
   * -------------------------
   */

  (function() {
    if (Modernizr.touchevents) {
      return;
    }

    $('body').on('mouseenter', '.product-item__inner', function() {
      $(this).find('.product-item__label--hidden').slideDown({duration: 250, easing: 'swing'});
    });

    $('body').on('mouseleave', '.product-item__inner', function() {
      $(this).find('.product-item__label--hidden').slideUp({duration: 250, easing: 'swing'});
    });
  })();

  /**
   * -------------------------
   * MARKETING POPUP
   * -------------------------
   */

  (function() {
    var popupModalInstance = null;

    var initPopup = function(element) {
      if (element.length === 0 || Modernizr.mq('(max-width: 559px)')) {
        return;
      }

      popupModalInstance = element.remodal({
        hashTracking: true,
        appendTo: '#shopify-section-popup'
      });

      setTimeout(function() {
        // We save into the cookie in order to avoid annoying the user
        if (popupModalInstance.getState() === 'closed' && !$.cookie('theme_popup_seen') && element.attr('data-visible') === 'true') {
          popupModalInstance.open();
        }

        $.cookie('theme_popup_seen', true, {expires: parseInt(element.attr('data-remember-me')) });
      }, parseInt(element.attr('data-delay')));
    };

    initPopup($('.promotion-popup'), false);

    $(document).on('shopify:section:select', '#shopify-section-popup', function() {
      if (popupModalInstance && popupModalInstance.getState() !== 'opened') {
        popupModalInstance.open();
      }
    });

    $(document).on('shopify:section:deselect', '#shopify-section-popup', function() {
      if (popupModalInstance) {
        popupModalInstance.close();
      }
    });

    $(document).on('shopify:section:load', '#shopify-section-popup', function(event) {
      initPopup($(event.target).find('.promotion-popup'));
    });
  })();

  /**
   * -------------------------
   * BACK TO TOP
   * -------------------------
   */

  (function() {
    var initBackToTop = function() {
      var backToTopElement = $('.back-to-top'),
        backToTopOffset = 300,
        backToTopDuration = 500;

      $(window).on('scroll.backToTop', function() {
        if ($(this).scrollTop() > backToTopOffset) {
          backToTopElement.addClass('back-to-top--active');
        } else {
          backToTopElement.removeClass('back-to-top--active');
        }
      });

      backToTopElement.on('click', function(e) {
        e.preventDefault();
        $('html, body').animate({
          scrollTop: 0
        }, backToTopDuration);

        return false;
      });
    };

    initBackToTop();

    $(document).on('shopify:section:unload', '#shopify-section-footer', function() {
      $(window).off('.backToTop');
    });

    $(document).on('shopify:section:load', '#shopify-section-footer', function() {
      initBackToTop();
    });
  }());
});
router.route('cart', function() {
  /**
   * -------------------------
   * CART NOTE AND ITEMS
   * -------------------------
   */

  var cartNotes = $('.cart__note textarea');

  cartNotes.on('change', function() {
    var newNote = $(this).val();

    // For styling purpose, we have two notes in the form, so we must make sure that updating one update all the notes in the DOM
    // for proper submission
    cartNotes.val(newNote);

    // Finally we also edit it through Ajax, in case the customer does not immediately submit the form
    $.post('/cart/update.js', {note: $(this).val()}, null, 'json');
  });

  $('.cart-item__quantity-input').on('change', function() {
    var element = $(this),
      lineItem = element.closest('.cart-item'),
      lineIndex = parseInt(lineItem.attr('data-index'));

    // We add one because Shopify uses 1-index numbering
    window.location.href = '/cart/change?quantity=' + parseInt($(this).val()) + '&line=' + lineIndex;
  });

  /**
   * -------------------------
   * SHIPPING ESTIMATOR
   * -------------------------
   */

  (function() {
    var shippingEstimator = $('.shipping-estimator'),
      shippingEstimatorSubmit = shippingEstimator.find('.shipping-estimator__submit'),
      shippingEstimatorResults = shippingEstimator.find('.shipping-estimator__results'),
      shippingEstimatorList = shippingEstimatorResults.find('.shipping-estimator__list'),
      cartEstimatedShipping = $('.cart__taxes');

    $('.shipping-estimator__submit').on('click', function() {
      shippingEstimatorSubmit.text(window.languages.shippingEstimatorSubmitting);

      $.ajax({
        method: 'GET',
        url: '/cart/shipping_rates.json',
        data: {
          shipping_address: {
            country: shippingEstimator.find('#address_country').val(),
            province: shippingEstimator.find('#address_province').val(),
            zip: shippingEstimator.find('#address_zip').val()
          }
        },
        success: function(results) {
          shippingEstimatorList.empty();

          if (results['shipping_rates'].length === 0) {
            shippingEstimatorResults.find('.shipping-estimator__results-title').text(window.languages.shippingEstimatorNoRates);
          } else {
            shippingEstimatorResults.find('.shipping-estimator__results-title').text(window.languages.shippingEstimatorRates);
          }

          results['shipping_rates'].forEach(function(item) {
            var amount = Shopify.formatMoney(item['price'] * 100, window.shop.moneyFormat);
            shippingEstimatorList.append('<li class="shipping-estimator__item">' + item['name'] + ': <span data-money-convertible>' + amount + '</span></li>');
          });

          if (results['shipping_rates'].length > 0) {
            var firstPrice = Shopify.formatMoney(results['shipping_rates'][0]['price'] * 100, window.shop.moneyFormat);
            cartEstimatedShipping.html(window.languages.cartEstimatedShipping + ' ' + firstPrice);
          }
        },
        error: function(results) {
          shippingEstimatorList.empty();
          shippingEstimatorResults.find('.shipping-estimator__results-title').text(window.languages.shippingEstimatorError);

          var response = results.responseJSON,
            errors = [];

          for (var key in response) {
            if (response.hasOwnProperty(key)) {
              errors.push({key: key, value: response[key][0]});
            }
          }

          errors.forEach(function(item) {
            shippingEstimatorList.append('<li class="shipping-estimator__item">' + item['key'] + ': ' + item['value'] + '</li>');
          });
        },
        complete: function(results) {
          shippingEstimatorSubmit.text(window.languages.shippingEstimatorSubmit);
          shippingEstimatorResults.show();
        }
      });

      return false;
    });
  }());

  new Shopify.CountryProvinceSelector('address_country', 'address_province', {hideElement: 'address_province_container'});
});
router.route('collections/*type', function() {
  /**
   * -------------------------
   * SORT BY AND SEARCH
   * -------------------------
   */

  (function() {
    var body = $('body');

    Shopify.queryParams = {};

    $('.collection-filter--sorter select').val(window.shop.collectionSortBy);

    body.on('change', '.collection-filter--sorter select', function () {
      Shopify.queryParams.sort_by = $(this).val();
      location.search = $.param(Shopify.queryParams);
    });

    if (location.search.length) {
      for (var aKeyValue, i = 0, aCouples = location.search.substr(1).split('&'); i < aCouples.length; i++) {
        aKeyValue = aCouples[i].split('=');

        if (aKeyValue.length > 1) {
          Shopify.queryParams[decodeURIComponent(aKeyValue[0])] = decodeURIComponent(aKeyValue[1]);
        }
      }
    }

    body.on('change', '.collection-filter:not(.collection-filter--sorter) select', function (event) {
      window.location.href = $(event.currentTarget).find(':selected').val();
    });
  }());

  /**
   * -------------------------
   * INFINITE SCROLLING FOR GRID
   * -------------------------
   */

  (function() {
    var initInfiniteScrollHelper = function(element) {
      element.infiniteScrollHelper({
        loadingClassTarget: '.collection__loader',
        loadingClass: 'collection__loader--loading',
        startingPageCount: window.shop.currentPage,
        hasMore: true,

        loadMore: function(page, done) {
          var loadingTarget = $(this.loadingClassTarget);

          if (!this.hasMore || loadingTarget.length == 0) {
            done();
            return;
          }

          var targetUrl = $.query.load(loadingTarget.attr('data-next-page'));

          // We need to modify the "page" attribute of the fetched URL
          targetUrl = targetUrl.set('page', page);

          $.ajax({
            url: location.protocol + '//' + location.host + location.pathname,
            data: targetUrl.toString().slice(1) // Allow to remove the initial "?" character
          }).then(function(content) {
            done();

            var productItems = $(content).find('.collection--grid').children();

            // Check if there is still content to load
            if (productItems.length === 0) {
              $('.collection--grid').infiniteScrollHelper('destroy');
              loadingTarget.remove();
            } else {
              // We can append the content to the .collection__list container
              $('.collection--grid').append(productItems);

              
            }
          });
        }
      });
    };

    initInfiniteScrollHelper($('.collection--grid'));

    $(document).on('shopify:section:unload', function(event) {
      $(event.target).find('.collection--grid').infiniteScrollHelper('destroy');
    });

    $(document).on('shopify:section:load', function(event) {
      initInfiniteScrollHelper($(event.target).find('.collection--grid'));
    });
  }());
});
router.route('', function() {
  /**
   * -------------------------
   * SLIDESHOW
   * -------------------------
   */

  (function() {
    var slideshow = $('.slideshow');

    var initSlideshow = function(slideshow) {
      slideshow.find('.slideshow__slides').slick({
        autoplay: (slideshow.attr('data-autoplay') === 'true'),
        autoplaySpeed: parseInt(slideshow.attr('data-cycle-speed')),
        fade: (slideshow.attr('data-animation-type') === 'fade'),
        adaptiveHeight: true,
        mobileFirst: true,
        accessibility: false,
        arrows: false,
        dots: true
      });
    };

    initSlideshow(slideshow);

    $(document).on('shopify:section:unload', '.shopify-section__slideshow', function(event) {
      $(event.target).find('.slideshow__slides').slick('unslick');
    });

    $(document).on('shopify:section:load', '.shopify-section__slideshow', function(event) {
      initSlideshow($(event.target).find('.slideshow'));
    });

    $(document).on('shopify:block:select', '.shopify-section__slideshow', function(event) {
      var currentSlide = $(event.target),
        slideshow = currentSlide.closest('.slideshow__slides');

      slideshow.slick('slickGoTo', currentSlide.attr('data-slide-index'));
      slideshow.slick('slickPause');
    });

    $(document).on('shopify:block:deselect', '.shopify-section__slideshow', function(event) {
      $(event.target).closest('.slideshow__slides').slick('slickPlay');
    });
  })();

  /**
   * -------------------------
   * SOCIAL FEEDS
   * -------------------------
   */

  (function() {
    var initInstagram = function(instagramAccessToken, limit) {
      var instagramTemplate = '<div class="instagram__image-wrapper"><a href="{{link}}" target="_blank"><div class="instagram__overlay"><p class="instagram__caption">{{caption}}</p><time class="instagram__date">{{model.created_time}}</time></div><img class="instagram__image" src="{{image}}"/></a></div>';

      var formatInstagramDate = function(image) {
        var date = new Date(image.created_time * 1000);

        m = date.getMonth();
        d = date.getDate();
        y = date.getFullYear();

        var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        image.created_time = monthNames[m] + ' ' + d + ', ' + y;

        return true;
      };

      var feed = new Instafeed({
        get: 'user',
        userId: 'self',
        accessToken: instagramAccessToken,
        sortBy: 'most-recent',
        limit: limit,
        resolution: 'thumbnail',
        template: instagramTemplate,
        after: function() {
          $('#instafeed-mobile').append($('#instafeed').html());
        },
        filter: $.proxy(formatInstagramDate),
        success: function(response){
          response.data.forEach(function(e){
            e.images.thumbnail = {
              url: e.images.thumbnail.url.replace('150x150', '640x640'),
              width: 640,
              height: 640
            };
          });
        }
      });

      feed.run();
    };

    var initTwitter = function(twitterUsername) {
      twttr.ready(function() {
        twttr.widgets.createTimeline(
          {
            sourceType: 'profile',
            screenName: twitterUsername
          },
          document.getElementById('twitter-timeline'),
          {
            tweetLimit: 1,
            chrome: 'noheader nofooter noborders transparent noscrollbar'
          }
        ).then(function(result) {
          // Twitter return the results in an iframe, so we need to parse the code to extract what we want

          var content = $(result).contents(),
            twitterModule = $('.tweet');

          twitterModule.find('.tweet__content').html(content.find('.timeline-Tweet-text'));
          twitterModule.find('.tweet__date').text(content.find('.timeline-Tweet-timestamp .dt-updated').attr('aria-label'));
        });
      });
    };

    var initFeeds = function(social) {
      var instagramAccessToken = social.attr('data-instagram-access-token'),
        twitterUsername = social.attr('data-twitter-username');

      if (instagramAccessToken) {
        initInstagram(instagramAccessToken, twitterUsername ? 3 : 6);
      }

      if (twitterUsername) {
        initTwitter(twitterUsername);
      }
    };

    initFeeds($('.index-module__social'));

    $(document).on('shopify:section:load', function(event) {
      initFeeds($(event.target).find('.index-module__social'));
    });
  })();
});
/**
 * ----------------------------------------------------------------------------------------------------
 * LOGIN
 * ----------------------------------------------------------------------------------------------------
 */

router.route('account/login', function() {
  /**
   * -------------------------
   * SWITCH TO RECOVER FORM
   * -------------------------
   */

  var switchToRecoverForm = function() {
    $('.login-form, .recover-form').toggle();
    $('.page__title').text(window.languages.passwordRecoverTitle);
  };

  $('[data-action="display-recover-form"]').on('click', function() {
    switchToRecoverForm();
    return false;
  });

  // We also switch if we directly have the hash "recover"
  if (window.location.hash === '#recover' || window.recoverPassword === true) {
    switchToRecoverForm();
  }
});
router.route('password', function() {
  $('.password__admin-link [data-action="storefront-password"]').on('click', function() {
    $('.password__storefront-form').slideDown();
  });
});
/**
 * ----------------------------------------------------------------------------------------------------
 * PRODUCT ROUTE
 * ----------------------------------------------------------------------------------------------------
 */

var productRoute = function() {
  var isMobile = Modernizr.mq('(max-width: 500px)');

  /**
   * -------------------------
   * SLIDESHOW
   * -------------------------
   */

  (function() {
    var initProductSlideshow = function(productSlideshow) {
      var isZoomEnabled = productSlideshow.attr('data-zoom-enabled'),
        zoomMagnification = productSlideshow.attr('data-zoom-magnification');

      productSlideshow.on('init afterChange', function(event, slick) {
        var currentSlide = $(slick.$slides[slick.currentSlide]);

        if (isZoomEnabled === 'true' && !currentSlide.attr('data-slide-initialized') && !Modernizr.touchevents) {
          currentSlide.zoom({
            url: currentSlide.attr('data-image-large-url'),
            touch: false,
            magnify: zoomMagnification,
            onZoomIn: function () {
              $(this).prev().addClass('product__slideshow-image--zoomed');
            },
            onZoomOut: function () {
              $(this).prev().removeClass('product__slideshow-image--zoomed');
            }
          });

          currentSlide.attr('data-slide-initialized', true);
        }
      });

      productSlideshow.slick({
        autoplay: false,
        adaptiveHeight: true,
        arrows: true,
        dots: true,
        fade: (productSlideshow.attr('data-rotation-effect') === 'fade'),
        mobileFirst: true,
        touchThreshold: 4,
        initialSlide: parseInt(productSlideshow.attr('data-initial-slide')),
        prevArrow: '<span class="slick-prev"><svg class="icon icon-arrow-left-thin"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#icon-arrow-left-thin"></use></svg></span>',
        nextArrow: '<span class="slick-next"><svg class="icon icon-arrow-right-thin"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#icon-arrow-right-thin"></use></svg></span>'
      });

      // Thumbnails
      productSlideshow.next('.product__thumbnails').find('.product__thumbnail').on('click', function() {
        productSlideshow.slick('slickGoTo', $(this).attr('data-index'));
        return false;
      });
    };

    initProductSlideshow($('.product__slideshow'));

    $(document).on('shopify:section:unload', function(event) {
      var target = $(event.target);

      target.find('.product__slideshow').slick('unslick');
      target.find('.product__slideshow-nav-image').off('click');
      $(document).off('.product__slideshow');
    });

    $(document).on('shopify:section:load', function(event) {
      initProductSlideshow($(event.target).find('.product__slideshow'));
    });
  }());

  /**
   * -------------------------
   * RELATED PRODUCTS
   * -------------------------
   */

  (function() {
    var relatedProductsSection = $('.related-products');
    relatedProductsSection.find('.related-products__item').pick(relatedProductsSection.attr('data-products-count')).show();

    $(document).on('shopify:section:load', function(event) {
      var relatedProductsSection = $(event.target).find('.related-products');
      relatedProductsSection.find('.related-products__item').pick(relatedProductsSection.attr('data-products-count')).show();
    });
  }());

  /**
   * -------------------------
   * PRODUCT TABS
   * -------------------------
   */

  (function() {
    var plugin = $('.product-tabs').tabs();
    $(document).on('shopify:section:select, shopify:section:unload', function(event) {
      var tabs = $(event.target).find('.product-tabs');
      tabs.data('plugin_tabs').destroy();
    });

    $(document).on('shopify:section:load', function(event) {
      $(event.target).find('.product-tabs').tabs();
    });
  })();

  /**
   * -------------------------
   * GALLERY COLLAGE
   * -------------------------
   */

  (function() {
    var initGalleryCollage = function(gallery) {
      gallery.finalTilesGallery({
        margin: isMobile ? 10 : 25,
        gridSize: 15,
        minTileWidth: isMobile ? 180 : Math.min(window.innerWidth - 25, 325),
        imageSizeFactor: [
          [2000, .6],
          [1024, .5],
          [480, .35]
        ]
      });
    };

    initGalleryCollage($('.product-collage-gallery'));

    $(document).on('shopify:section:load', function(event) {
      var gallery = $(event.target).find('.product-collage-gallery');

      if (gallery.length > 0) {
        initGalleryCollage(gallery);
      }
    });
  })();

  /**
   * -------------------------
   * PRODUCT REVIEWS
   * -------------------------
   */

  (function() {
    var originalReviewText = null;

    $('.product').on('click', '.spr-summary-actions-newreview', function() {
      var element = $(this),
        closeText = window.languages.closeReview,
        currentText = element.text();

      if (currentText !== closeText) {
        originalReviewText = currentText;
        element.text(closeText);
      } else {
        element.text(originalReviewText);
      }
    });
  }());
};

router.route('products/*type', productRoute);
router.route('collections/*collection/products/*type', productRoute);
router.route('search', function() {
});

$(document).ready(function() {
  var notificationCallback = function(data) {
    var msg = '';
    if (data.status == 'OK') {
      msg = data.message; // just show the success message
    } else { // it was an error
      for (var k in data.errors) {  // collect all the error messages into a string
        msg += (k + " " + data.errors[k].join());
      }
    }
    $('.feedback-message').text(msg);
  };
  $('#notify_button').click(function(e) {
    var product_id = $(this).data('product-id');
    var variant_id = $(this).data('variant-id');
    e.preventDefault();
    var email = $('#notify_email').val(),
        productId = product_id,  // rendered by Liquid
        variantId = variant_id; // rendered by Liquid
    BIS.create(email, variantId, productId).then(notificationCallback);
  })
});