jquery.simpleTagger
=============

Transforms a &lt;select&gt; element into a nice tagger input field. Inpired by bootstrap-tasinput (https://github.com/TimSchlechter/bootstrap-tagsinput).


How to use:
&lt;select class="tagger"&gt;
  &lt;option&gt;Javascript&lt;/option&gt;
  &lt;option&gt;HTML&lt;/option&gt;
  &lt;option&gt;CSS&lt;/option&gt;
&lt;/select&gt;

&lt;script&gt;
  $(".tagger").simpleTagger({
  	confirmDelete: false,
  	maxNbTags: 10
  });
&lt;/script&gt;