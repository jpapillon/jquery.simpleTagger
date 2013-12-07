jquery.tagger
=============

Transforms a <select> element into a nice tagger input field. Inpired by bootstrap-tasinput (https://github.com/TimSchlechter/bootstrap-tagsinput).


How to use:
<select class="tagger">
  <option>Javascript</option>
  <option>HTML</option>
  <option>CSS</option>
</select>

<script>
  $(".tagger").tagger({
  	confirmDelete: false,
  	maxNbTags: 10
  });
</script>