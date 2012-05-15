pageguide.js
============

An interactive guide for web page elements using jQuery and CSS3.

## How-to:
1. Add references in your code to pageguide.js & pageguide.css
2. Add a simple <ul> to the bottom of the pages you want the pageguide to appear on.
3. Customize the page guide tour title.

## An example:

### Step 1 - Add pageguide.js 

Add `<script src="pageguide.js"></script>` to the bottom of your html document, right before your closing `</body>` tag.
We provide both the standard js as well as a minified version.

### Step 1 - Add pageguide.js 

Add `<link rel="stylesheet" href="stylesheets/pageguide.css">` to the header of your html document.
We provide a css file as well as a minified version. Alternatively, we use <a href="http://lesscss.org/" target="_blank">LESS CSS</a> at Tracelytics, so we provid that as well. 

### Step 3 - Choose the elements that you want included in the page guide.
The page guide matches the first occurence of the selector you specify in the <ul> you put on your pages in the next step.

### Step 3 - Add the pageguide `<ul>` near the bottom of your pages.

HTML

    <ul id="tlyPageGuide" data-tourtitle="REPLACE THIS WITH A TITLE">
      <li class="tlypageguide_left" data-tourtarget=".first_element_to_target">
        <div>
          Here is the first tour item description. The number will appear to the left of the element.
        </div>
      </li>
      <li class="tlypageguide_right" data-tourtarget="#second_element_to_target">
        <div>
          Here is the second tour item description. The number will appear to the right of the element.
        </div>
      </li>
      <li class="tlypageguide_top" data-tourtarget=".third_element_to_target">
        <div>
          Here is the third tour item description. The number will appear above of the element.
        </div>
      </li>
      <li class="tlypageguide_bottom" data-tourtarget="#fourth_element_to_target">
        <div>
          Here is the fourth tour item description. The number will appear below of the element.
        </div>
      </li>
    </ul>


## See it IRL:
* http://tracelytics.github.com/pageguide

## Contribute
Bugfix?  Cool new feature?  Alternate style?  Send us a pull request!
