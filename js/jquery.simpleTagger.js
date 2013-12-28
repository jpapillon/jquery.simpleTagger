/* http://github.com/jpapillon/jquery.simpleTagger */
/* global jQuery, $ */
(function ($) {
  'use strict';

  // Plugin defaults
  var defaultOptions = {
    addKeys: [9, 13], // Tab, Enter
    placeholderText: "Add...",
    maxNbTags: false,
    confirmDelete: false,
    caseSensitive: false,
    disableAdd: false,

    attrValue: null,
    createFn: function(value) {
      return value;
    }
  };

  function SimpleTagger(elem, options) {
    var self = this;
    this.options = options;

    this.$select = elem;
    this.$select.hide();

    // Wrap everything under a container
    this.$select.wrapAll($('<div class="tagger-container" />'));
    this.$container = elem.parents(".tagger-container");

    this.$inputContainer = $('<div class="input-container" />');
    this.$input = $('<input type="text" />');
    this.$placeholder = $('<span class="placeholder">' + (this.options.placeholderText ? this.options.placeholderText : "") + '</span>')
    this.$inputContainer.append(this.$input).append(this.$placeholder);
    this.$select.after(this.$inputContainer);

    // Add values set in the options
    this.$select.find("option").each(function() {
      // Set option correctly & add tag
      var value = $(this).val();
      $(this).val(value).text(value);
      self.addTag(value);
    });

    (this.$select.is(":disabled")) ? this.disable() : this.enable();
    this.adjustInputWidth();
  };

  SimpleTagger.prototype = {
    constructor: SimpleTagger,

    getTags: function() {
      var tags = [];
      this.$container.find(".tagger-tag").each(function() {
        tags.push($(this).data("value"));
      });
      return tags;
    },

    getTagIdentifier: function(tag) {
      var value = tag.data("value");
      if (this.options.attrValue) {
        return value[this.options.attrValue];
      }
      return value;
    },

    findTag: function(value) {
      var self = this;
      return this.$container.find(".tagger-tag").filter(function() {
        var a = self.getTagIdentifier($(this));
        var b = value;
        // If case sensitive is set to true, transform values to lowercase
        if (self.options.caseSensitive) {
          a = a.toLowerCase();
          b = b.toLowerCase();
        }
        return a === b;
      });
    },

    addTag: function(value) {
      var added = false;
      value = $.trim(value || this.$input.val());
      if (value !== "") {
        var existingTag = this.findTag(value);
        if (existingTag.length > 0) {
          // Highlight already existing tag
          existingTag.css("opacity", 0).animate({opacity: 1}, 300);
        } else {
          added = true;
          var tag = this.getCalculatedTag(value);
          tag.data("value", this.options.createFn(value));
          this.$inputContainer.before(tag);
          this.inputReset();

          // Add option to select
          if (this.$select.find('option[value="' + value + '"]').length === 0) {
            this.$select.append('<option value="' + value + '"/>');
          }
        }
      }

      return added;
    },

    removeTag: function(value) {
      var self = this;
      this.$container.find(".tagger-tag").filter(function() { return self.getTagIdentifier($(this)) === value; }).remove();

      // Remove option from select
      this.$select.find('option[value="' + value + '"]').remove();
    },

    removeTags: function() {
      this.$container.find(".tagger-tag").remove();

      // Remove all options from select
      this.$select.find("option").remove();
    },

    setTags: function(tags) {
      this.removeTags();
      for (var i = 0; i < tags.length; i++) {
        this.addTag(tags[i]);
      }
    },

    reachedNbMaxTags: function() {
      return this.options.maxNbTags && this.getTags().length >= this.options.maxNbTags;
    },

    addTagFromKeyboard: function(value) {
      if (!this.options.disableAdd) {
        this.addTag(value);
      }
    },

    enable: function() {
      this.setEvents();
      this.$input.prop("disabled", false);
      this.$container.removeClass("tagger-disabled");
    },

    disable: function() {
      this.unsetEvents();
      this.$input.prop("disabled", true);
      this.$container.addClass("tagger-disabled");
    },

    setEvents: function() {
      var self = this;

      if (!this.options.disableAdd) {
        // Event when the input loses focus
        this.$input.on("blur", function(e) {
          // Try to add a tag with current input and remove it afterwards
          self.addTagFromKeyboard(self.$input.val());
          self.$input.val("");
          self.$placeholder.show();
          var tags = self.$container.find(".tagger-tag");
          tags.removeClass("confirm");
          tags.last().after(self.$inputContainer);
        });
      }

      // Event when user pastes content into the input
      this.$input.on("paste", function(e) {
        self.$placeholder.hide();
        if (self.reachedNbMaxTags()) {
          // Don't do anything if the maximum number of tags was reached
          e.preventDefault();
          e.stopPropagation();
        } else {
          var elem = this;
          // Little IE hack, to keep focus on the input
          setTimeout(function(e) {
            self.adjustInputWidth($(elem).val());
          }, 0);
        }
      });

      // Used when backspace/delete keys are released
      this.$input.on("keyup", function(e) {        
        // Show placeholder if nothing is in the input
        if (self.$input.val().length === 0) {
          self.$placeholder.show();
        } else {
          self.$placeholder.hide();
        }
        self.adjustInputWidth();
      });

      // When a key is down (but has not been entered in the input field)
      this.$input.on("keydown", function(e) {
        var inputText = self.$input.val();
        switch (e.which) {
          case 8: // Backspace
          case 46: // Delete
            if (inputText.length === 0) {
              // Input text was empty before hitting backspace/delete
              var elem;
              if (e.which === 8) { // Backspace
                elem = self.$inputContainer.prev(".tagger-tag");
              } else { // Delete
                elem = self.$inputContainer.next(".tagger-tag");
              }

              // Check if user needs to confirm
              if (self.options.confirmDelete) {
                // Remove the confirm class to others if it was set earlier
                elem.siblings().removeClass("confirm");

                if (elem.hasClass("confirm")) {
                  self.removeTag(self.getTagIdentifier(elem));
                } else {
                  elem.addClass("confirm");
                }
              } else {
                self.removeTag(self.getTagIdentifier(elem));
              }
            }
            // Will adjust input width on "keyup"
            break;
          case 37: // Left arrow
            if (inputText.length === 0) {
              self.goToPreviousTag();
            }
            break;
          case 39: // Right arrow
            if (inputText.length === 0) {
              self.goToNextTag();
            }
            break;
        }

        if (e.keyCode !== 8 && e.keyCode !== 46) {
          // Remove Class confirm if it was previously set and user changed his mind
          self.$container.find(".tagger-tag").removeClass("confirm");
        }
      });

      // When something has been entered in the input field
      this.$input.on("keypress", function(e) {
        var inputText = self.$input.val();
        if (e.keyCode !== 8 && e.keyCode !== 46) {
          // Remove Class confirm if it was previously set and user changed his mind
          self.$container.find(".tagger-tag").removeClass("confirm");
        }

        switch (e.keyCode) {
          case 8: // Backspace
          case 46: // Delete
            // do nothing!
            break;
          default:
            if ($.inArray(e.keyCode, self.options.addKeys) !== -1) {
              // User pressed the keys that will trigger the add tag
              if ($.trim(self.$input.val()) !== "") {
                if (self.addTagFromKeyboard()) {
                  self.$placeholder.show();
                }
                e.preventDefault();
                e.stopPropagation();
              }
              self.adjustInputWidth();
            } else if (!e.ctrlKey && self.reachedNbMaxTags()) {
              e.preventDefault();
              e.stopPropagation();
            } else {
              // Remove Class confirm if it was previously set and user changed his mind
              self.$container.find(".tagger-tag").removeClass("confirm");
              self.$placeholder.hide();
              self.adjustInputWidth(self.$input.val() + String.fromCharCode(e.which));
            }
            break;
        }
      });

      // When user clicks on the container, it will focus the input field
      this.$container.on("click", function(e) {
        self.$input.focus();
      });

      this.$container.on("click", ".tagger-tag .remove-tag", function(e) {
        self.removeTag(self.getTagIdentifier($(e.target).parents(".tagger-tag")));
      });
    },

    unsetEvents: function() {
      this.$input.off("blur");
      this.$input.off("paste");
      this.$input.off("keyup");
      this.$input.off("keydown");
      this.$input.off("keypress");
      this.$container.off("click", ".tagger-tag .remove-tag");
      this.$container.off("click");
    },

    goToPreviousTag: function() {
      this.$inputContainer.prevAll(".tagger-tag").first().before(this.$inputContainer);
      this.inputReset();
    },

    goToNextTag: function() {
      this.$inputContainer.nextAll(".tagger-tag").first().after(this.$inputContainer);
      this.inputReset();
    },

    inputReset: function(noFocus) {
      this.$input.val("");

      // To update focus on input (IE)
      var self = this;
      setTimeout(function() { self.$input.focus(); }, 10);

      this.adjustInputWidth();
    },

    getCalculatedTag: function(value) {
      var testSubject = $("#tagger-widthCalculator");
      if (testSubject.length === 0) {
        testSubject = $('<div id="tagger-widthCalculator" class="tagger-tag" />').css({
          position: "absolute",
          top: -9999,
          left: -9999,
          whiteSpace: "nowrap"
        });
        $("body").append(testSubject);
      }

      var changeContent = function(text) {
        testSubject.html(escapeHtml(text));
      }

      changeContent(value);
      var width = testSubject.outerWidth();
      var containerWidth = this.$container.width();
      var fullWidth = width > containerWidth;

      var self = this;
      var getCalculatedHtml = function(text) {
        changeContent(text);
        var width = testSubject.outerWidth();
        if (width <= containerWidth) {
          // Adjust one last time with 'x'
          testSubject.html(escapeHtml(text) + '<span class="remove-tag">&times;</span>');
          width = testSubject.outerWidth();
          if (width <= containerWidth) { 
            return escapeHtml(text) + '<span class="remove-tag">&times;</span>';
          } else {
            return escapeHtml(text) + '<br /><span class="remove-tag">&times;</span>';
          }
        } else {
          // Ratio it down first
          var ratio = containerWidth / width;
          var pos = parseInt(text.length * ratio, 10);
          changeContent(text.substr(0, pos));
          width = testSubject.outerWidth();

          var adjusted = false;
          if (width > containerWidth) {
            // Adjust again if it is still bigger; do one character at a time
            while (width > containerWidth) {
              adjusted = true;
              pos--;
              changeContent(text.substr(0, pos));
              width = testSubject.outerWidth();
            }
             // Adjust position to be a number of characters to get to that index
          } else {
            // Adjust if it is shorter; do one character at a time
            while (width < containerWidth) {
              pos++;
              changeContent(text.substr(0, pos));
              width = testSubject.outerWidth();
            }
            pos--; // Adjust position
          }
        }

        // Find the last space to return on it, if present, otherwise break the word
        var line = text.substr(0, pos);
        var lastSpacePos = line.lastIndexOf(" ");
        if (lastSpacePos !== -1) {
          pos = lastSpacePos;
        }

        return escapeHtml(text.substr(0, pos)) + "<br />" + getCalculatedHtml($.trim(text.substr(pos)));  
      }

      return $('<div class="tagger-tag' + (fullWidth?' full-width':'') + '">' + getCalculatedHtml(value) + '</div>');
    },

    adjustInputWidth: function(value) {
      value = value || this.$input.val(); // Take what is in the input field if value is not given

      // Create fake div to calculate actual text width
      $("taggerWidth").remove();
      var testSubject = $("<taggerWidth/>").css({
        position: "absolute",
        top: -9999,
        left: -9999,
        fontSize: this.$input.css("fontSize"),
        fontFamily: this.$input.css("fontFamily"),
        fontWeight: this.$input.css("fontWeight"),
        letterSpacing: this.$input.css("letterSpacing"),
        whiteSpace: "nowrap"
      });
      testSubject.html(escapeHtml(value));
      $("body").append(testSubject);

      var valueWidth = testSubject.width();

      // Use placeholder if it was set in the options
      var placeholderWidth = 0;
      if (this.options.placeholderText) {
        testSubject.html(escapeHtml(this.options.placeholderText));
        placeholderWidth = testSubject.width();
      }

      var width = Math.max(valueWidth, placeholderWidth);

      var diff = this.$input.outerWidth() - this.$input.width(); // Keep a little margin
      this.$input.width(Math.min(this.$container.width() - diff, width + 1 /* The text cursor */));
    }
  };

  var escapeHtml = function(text) {
    return text.replace(/&/g, "&amp;")
               .replace(/</g, "&lt;")
               .replace(/>/g, "&gt;")
               .replace(/"/g, "&quot;")
               .replace(/'/g, "&#039;")
               .replace(/ /g, "&nbsp;");
  };

  $.fn.simpleTagger = function(arg1, arg2) {
    var self = this;
    var tagger = $(this).data("tagger");
    if (!tagger) {
      var options = $.extend({}, defaultOptions, arg1);
      return this.each(function() {
        var tagger = new SimpleTagger($(this), options);
        $(this).data("tagger", tagger);
      });
    } else {
      if (tagger[arg1]) {
        return tagger[arg1](arg2);
      }
    }
  };
}(window.jQuery));