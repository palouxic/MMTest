var templates = [
    "root/externallib/text!root/plugins/participants/participants.html",
    "root/externallib/text!root/plugins/participants/participant.html",
    "root/externallib/text!root/plugins/change_layout/new_body.html"
];

define(templates,function (participantsTpl, participantTpl, newBodyTpl) {

    MM.debugging = true;

    var plugin = {
        settings: {
            name: "change_layout",
            type: "",
            menuURL: "#change_layout/",
            lang: {
                component: "core"
            },
            icon: ""
        },

        templates: {
            "participant": {
                model: "participant",
                html: participantTpl
            },
            "participants": {
                html: participantsTpl
            }
        }
    };



    $('body').html(newBodyTpl);
    $('head').append('<link rel="stylesheet" href="plugins/change_layout/css/layout.css" type="text/css" />');
    //$('head').append('<link rel="stylesheet" href="plugins/change_layout/css/new_styles.css" type="text/css" />');

    /**
     * Calculate the size of the panels in pixels (fixed sizes)
     *
     */
    MM.panels.calculatePanelsSizes = function() {
        var screenWidth = $(document).innerWidth();

        MM.panels.sizes.welcomePanel = {
            left:   0,
            center: screenWidth,
            right:  0
        };

        MM.panels.sizes.twoPanels = {
            left:   0,
            center: 320,
            right:  screenWidth - 320
        };

        MM.panels.sizes.threePanels = {
            left:   0,
            center: 320,
            right:  screenWidth - 320
        };
    };

    var self = this;

    /**
     * Fix the initial size of the panels in pixels (fixed sizes)
     *
     */
    MM.panels.fixPanelsSize = function() {

        $("#panel-left").css("width", "100%");

        $("#panel-center").css("width", MM.panels.sizes.threePanels.center);
        $("#panel-center").css("left", MM.panels.sizes.threePanels.left);

        $("#panel-right").css("width", MM.panels.sizes.threePanels.right);
        $("#panel-right").css("left", MM.panels.sizes.threePanels.left + MM.panels.sizes.threePanels.center);

        $(".header-wrapper").css("width", MM.panels.sizes.twoPanels.right);
        $(".header-wrapper").css("left",  MM.panels.sizes.twoPanels.left);
    };

    /**
     * Resize panels on orientation change
     *
     */
    MM.panels.resizePanels = function() {
    MM.log('Test: Resize panels', 'Core');
        MM.panels.calculatePanelsSizes();

        // Two panels view
        if ($("#panel-right").css("left") == $("#panel-center").css("width")) {
            $("#panel-right").css("width", MM.panels.sizes.twoPanels.right);
            $(".header-wrapper").css("width", "100%");
        } else {
            $("#panel-right").css("width", MM.panels.sizes.threePanels.right);
            $(".header-wrapper").css("width", MM.panels.sizes.twoPanels.right);
        }
    };

    /**
     * Load courses.
     */
    MM.loadCourses = function(courses) {
        var plugins = [];
        var coursePlugins = [];

        for (var el in MM.config.plugins) {
            var index = MM.config.plugins[el];
            var plugin = MM.plugins[index];
            if (typeof plugin == 'undefined') {
                continue;
            }
            // Check if the plugin is Visible.
            // If the iPluginVisible function is undefined, we assume the plugin is visible without additional checks.
            if (typeof(plugin.isPluginVisible) == 'function' && !plugin.isPluginVisible()) {
                continue;
            }
            if (plugin.settings.type == 'general') {
                plugins.push(plugin.settings);
            } else if (plugin.settings.type == 'course') {
                coursePlugins.push(plugin.settings);
            }
        }

        // Prepare info for loading main menu.
        values = {
            user: {
                fullname: MM.site.get('fullname'),
                profileimageurl: MM.site.get('userpictureurl')
            },
            siteurl: MM.site.get('siteurl'),
            coursePlugins: coursePlugins,
            courses: courses,
            plugins: plugins
        };

        // Load the main menu template.
        var output = MM.tpl.render($('#menu_template').html(), values);
        MM.panels.html('left', output);

        // TODO: Why???
        $('.submenu:not(:first)').hide();
        $('.submenu').hide();
        $('.toogler').bind(MM.clickType, function(e) {
            // This prevents open the toogler when we are scrolling.
            if (MM.touchMoving) {
                MM.touchMoving = false;
            } else {
                $(this).next().slideToggle(300);
                $(this).toggleClass("collapse expand");

                var currentTop = parseInt($('#panel-center').css('top'), 10);

                if($(this).hasClass('expand')){
                    var newTop = (currentTop-50) + 'px';
                    $('#panel-center').animate( {'top' : newTop}, 300 );
                }
                else{
                    var newTop = (currentTop+50) + 'px';
                    $('#panel-center').animate({'top':newTop}, 300);
                }
            }
        });

        // Store the courses
        for (var el in courses) {
            // We clone the course object because we are going to modify it in a copy.
            var storedCourse = JSON.parse(JSON.stringify(courses[el]));
            storedCourse.courseid = storedCourse.id;
            storedCourse.siteid = MM.config.current_site.id;
            // For avoid collising between sites.
            storedCourse.id = MM.config.current_site.id + '-' + storedCourse.courseid;
            var r = MM.db.insert('courses', storedCourse);
        }

        // Hide the Add Site panel.
        $('#add-site').css('display', 'none');
        // Display the main panels.
        $('#main-wrapper').css('display', 'block');

        if (MM.deviceType == 'tablet') {
            MM.panels.html('center', '<div class="welcome">' + MM.lang.s("welcome") + '</div>');
            MM.panels.menuShow(true, {animate: false});
            MM.panels.hide('right', '');
        }

        self.resizeLeftMenuItems();
        self.getCustomCSS();
    };

    resizeLeftMenuItems = function(){

        var contentWidth = $('#panel-left header').innerWidth();

        var lists = $('#panel-left').find('ul.nav.nav-v.js-accordion');

        $.each(lists, function(index, myList){

            var numchilds = $(myList).children().length;
            var newWidth = contentWidth / Math.min( numchilds, 4.1 ) ;

            if(numchilds > 4)
                $(myList).parent().css('width', newWidth*numchilds);

            $(myList).children().css('width', newWidth);
            $(myList).children().css('float', 'left');
            $(myList).children().last().css('width', newWidth);
            $(myList).children().last().css('float', 'none');
            $(myList).children().last().css('margin-left', newWidth*(numchilds-1));
            //$(myList).children().last().css('position', 'absolute');

        });

        lists = $('#panel-left').find('ul.nav.submenu');

        $.each(lists, function(index, myList){

            var parentWidth = $(myList).parent().innerWidth();

            var numchilds = $(myList).children().length;
            var newWidth = Math.floor( contentWidth / numchilds );

            $.each($(myList).children(), function(index, child){

                $(child).css('width', newWidth);

                if( index * newWidth + 1 >= parentWidth){
                    $(child).css('float', 'none');
                    $(child).css('margin-left', newWidth*index);
                    $(child).css('position', 'absolute');
                }
                else{
                    $(child).css('float', 'left');
                }

            });

        });

    };

    getCustomCSS = function(){

        MM.fs.init(function(){

            alert('Root: '+MM.fs.getRoot());

            MM.fs.fileExists(
                'plugins/change_layout/files/new_styles.css', 
                function(fileURL){
                    alert('Exists');

                }, function(){
                    alert('No exists');
            });

        });



/*
         */

        /*var cachedCSS = MM.cache.getElement('testcss', true);

        if(cachedCSS){

            MM.log('Getting cached CSS', 'Sync');

            $('head').append('<style>'+cachedCSS+'</style>');

        }
        else{

            alert('Not there');

            MM.log('Getting CSS from file', 'Sync');

            $.ajax({
                url: "http://timeondriver.com/_old/new_styles.css",
                success: function(data) {

                    MM.log('Success', 'Sync');

                    MM.cache.addElement('testcss', data, 'css');

                    $('head').append('<style>'+data+'</style>');
                    
                },
                error: function(xhr, ajaxOptions, thrownError) {
                  var error = MM.lang.s('cannotconnect');
                  if (xhr.status == 404) {
                      error = MM.lang.s('invalidscheme');
                  }
                  MM.log('Error downloading CSS' + error, 'Sync');
                }
            });

        }*/
    };




    MM.registerPlugin(plugin);
});

