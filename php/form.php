<?php
	
	//$code = $argv[1];
	$code = $_GET["code"];
	//echo $code;
	$target_url = 'https://www.strava.com/oauth/token?client_id=14160&client_secret=9418bbb1abcaffb68263aabd51a2c732e4d82564&code='.$code;
        //This needs to be the full path to the file you want to send.
        /* curl will accept an array here too.
         * Many examples I found showed a url-encoded string instead.
         * Take note that the 'key' in the array will be the key that shows up in the
         * $_FILES array of the accept script. and the at sign '@' is required before the
         * file name.
         */
	//$post = array('extra_info' => '123456','file_contents'=>'@'.$file_name_with_full_path);
 
    $ch = curl_init();
	curl_setopt($ch, CURLOPT_URL,$target_url);
	curl_setopt($ch, CURLOPT_POST,1);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER,1);
	$result=curl_exec ($ch);
	curl_close ($ch);
	echo $result;
?>
