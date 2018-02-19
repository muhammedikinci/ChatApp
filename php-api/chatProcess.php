<?php 

class ChatClass{
	
	private $Database;
	private $TargetUserName;
	private $CurrentUserName;

	private $SenderUserID;
	private $RecUserID;
	private $CurrentMessage;

	private $ErrorMessage;
	private $LoginPermission = false;

	function __construct(){
        $this->PrintHeader();
		//Veritabanını dene
		if($this->TryConnectToDB()){
			$this->ProcessSelector();
			if(strlen($this->ErrorMessage) > 0){
				echo '{"status":"fail","error":"'.$this->ErrorMessage.'"}';
			}
		}
		else{
			echo '{"status":"db_fail","error":"'.$this->ErrorMessage.'"}';
		}
	}

	/* 
	 * Gelen veriye göre doğru fonksiyonu işleme al.
	 */
	function ProcessSelector(){
		$PROCESS_SELECTOR = $_POST['PROCESS_SELECTOR'];
		switch($PROCESS_SELECTOR){
			case "GetCurrentUserMessagesDatas":
				$this->GetCurrentUserMessagesDatas();
				break;
			case "sendMessage";
				$this->sendMessage();
				break;
			case "getAllUsers":
				$this->getAllUsers();
				break;
			default:
				echo '{"status":"fail","error":"invalid"}';
				break;
		}
		
	}

	/* 
	 * Gelen kullanıcı bilgilerine göre daha önce gönderilmiş  
     * mesajları al.
	 */
	function GetCurrentUserMessagesDatas(){
		//Verileri kontrol et
		if(isset($_POST['targetusername']) && 
		   isset($_POST['currentusername']) && 
		   !empty($_POST['targetusername']) &&
		   !empty($_POST['currentusername']) &&
		   strlen($_POST['targetusername']) > 3 &&
		   strlen($_POST['currentusername']) > 3){
			$this->TargetUserName = htmlspecialchars($_POST['targetusername']);
			$this->CurrentUserName = htmlspecialchars($_POST['currentusername']);

			$QueryString = sprintf("Select * from `chat` where 
			`user_id_send` = '%s' and  
			`user_id_get` = '%s' or 
			`user_id_send` = '%s' and  
			`user_id_get` = '%s' 
			order by `id` desc limit 15",
			$this->CurrentUserName,
			$this->TargetUserName,
			$this->TargetUserName,
			$this->CurrentUserName);
			$Query_Result = $this->Database->query($QueryString);

			$container = [];
			if ($Query_Result) {
				$text = '{"status":"ok","value":"[';
				foreach ($Query_Result as $key) {
					array_push($container,'{\"currentUserName\":\"'.$key["user_id_send"].'\",\"targetUserName\":\"'.$key["user_id_get"].'\",\"message\":\"'.$key["message"].'\"},');
				}
				$cont = array_reverse($container);
				foreach ($cont as $key) {
					$text .= $key;
				}
				$text = rtrim($text,",");
				$text .= ']"}';
				echo $text;
			}
			else{
				$text = '{"status":"no","value":"[]';
			}

		}
		else{
			$this->ErrorMessage = "Alanları boş bırakamazsın!";
		}
	}

	/* 
	 * Yeni mesaj gönder
	 */
	function sendMessage(){
		//Verileri kontrol et
		if(isset($_POST['sender_user_id']) && 
		   isset($_POST['rec_user_id']) && 
		   isset($_POST['currentMessage']) && 
		   !empty($_POST['sender_user_id']) &&
		   !empty($_POST['rec_user_id']) &&
		   !empty($_POST['currentMessage']) &&
		   strlen($_POST['sender_user_id']) > 3 &&
		   strlen($_POST['rec_user_id']) > 3 &&
		   strlen($_POST['currentMessage']) > 0){

			// Değişkenler
				$this->SenderUserID = htmlspecialchars($_POST['sender_user_id']);
				$this->RecUserID = htmlspecialchars($_POST['rec_user_id']);
				$this->CurrentMessage = htmlspecialchars($_POST['currentMessage']);
				$SenderID = "";
				$Sender_Messanger_IDList = "";
				$ReceiverID = "";
				$Rec_Messanger_IDList = "";	
			//
			
			// Gönderen kullanıcının id sini al
				$SenderUserQueryString = sprintf("
				SELECT `Usr_ID`,`Usr_Messanger_IDList` FROM 
				`users` WHERE 
				`Usr_Name` = '%s'", $this->SenderUserID);

				$SenderUserQuery = $this->Database->query($SenderUserQueryString);
				if($rw = $SenderUserQuery->fetch()){
					$SenderID = $rw['Usr_ID'];
					$Sender_Messanger_IDList = $rw['Usr_Messanger_IDList'];
				}
			//
					
			// Alıcı kullanıcının id sini al
				$ReceiverUserQueryString = sprintf("
				SELECT `Usr_ID`,`Usr_Messanger_IDList` FROM 
				`users` WHERE 
				`Usr_Name` = '%s'", $this->RecUserID);

				$ReceiverUserQuery = $this->Database->query($ReceiverUserQueryString)->fetch(PDO::FETCH_ASSOC);
				if($ReceiverUserQuery){
					$ReceiverID = $ReceiverUserQuery['Usr_ID'];
					$Rec_Messanger_IDList = $ReceiverUserQuery['Usr_Messanger_IDList'];
				}
			//

			$isContains = FALSE;
			//Daha önce mesajlaşma eklenmemişse şimdi mesajlaşma bağını oluştur.
				if(	(stripos($Sender_Messanger_IDList, '.'.$ReceiverID.'.') !== FALSE)
					||
					(stripos($Sender_Messanger_IDList, $ReceiverID.'.') !== FALSE)
					||
					(stripos($Sender_Messanger_IDList, '.'.$ReceiverID) !== FALSE)){
				}
				else{
					$isContains = TRUE;
					$Sender_Messanger_IDList .= '.'.$ReceiverID;
					$Sender_ID_Add = $this->Database->prepare(
						"UPDATE `users` SET `Usr_Messanger_IDList`=:id_list WHERE `Usr_ID`=:usr_id"
					);
					$Sender_ID_Add_Query = $Sender_ID_Add->execute(array(
						"id_list" => $Sender_Messanger_IDList,
						"usr_id" => $SenderID
					));
					if(!$Sender_ID_Add_Query){
					}

					$Rec_Messanger_IDList .= '.'.$SenderID;
					$Rec_ID_Add = $this->Database->prepare(
						"UPDATE `users` SET `Usr_Messanger_IDList`=:id_list WHERE `Usr_ID`=:usr_id"
					);
					$Rec_ID_Add_Query = $Rec_ID_Add->execute(array(
						"id_list" => $Rec_Messanger_IDList,
						"usr_id" => $ReceiverID
					));
					if(!$Rec_ID_Add_Query){
					}
				}
			//

			$QueryString = sprintf("Insert Into `chat` set 
			`user_id_send` = '%s', 
			`user_id_get`  = '%s', 
			`message`      = '%s'",
			$this->SenderUserID,
			$this->RecUserID,
			$this->CurrentMessage);
			$Query_Pre = $this->Database->prepare($QueryString);
			$Query_Result = $Query_Pre->execute();

			if ($Query_Result && $isContains) {
				echo '{"status":"ok","NewUser":"'.$this->RecUserID.'"}';
			}
			else if($Query_Result){
				echo '{"status":"ok","SenderName":"'.$this->SenderUserID.'"}';
			}
			else{
				echo '{"status":"no","error":"Gerekli bilgiler bulunamadı."}';
			}

		}
		else{
			$this->ErrorMessage = "Alanları boş bırakamazsın!";
		}
	}

	/* 
	 * Mesajlaşılmış kullanıcıları çek
	 */
	function getAllUsers(){
		//Verileri kontrol et
		if(isset($_POST['username']) &&
		   !empty($_POST['username']) &&
		   strlen($_POST['username']) > 3){
			$UserName = htmlspecialchars($_POST['username']);
			$qu = $this->Database->query("Select * from users where `Usr_Name` = '".$UserName."'")->fetch(PDO::FETCH_ASSOC);
			if ($qu) {			
				$text = '{"status":"ok","value":"[';
				$Users = [];
				$ListText = $qu['Usr_Messanger_IDList'];
				$parsed = explode('.',$ListText);
				foreach ($parsed as $key) {
					$qu2 = $this->Database->query("Select * from `users` where `Usr_ID` = '".$key."'")->fetch(PDO::FETCH_ASSOC);
					if ($qu2) {
						array_push($Users,$qu2['Usr_Name']); 
					}
				}
				for($i = 0; $i < count($Users); $i++){
					if (count($Users) - $i == 1) {
						$text .= '{\"UserName\":\"'.$Users[$i].'\"}';
					}
					else{
						$text .= '{\"UserName\":\"'.$Users[$i].'\"},';
					}
				}
				$text .= ']"}';
				echo $text;
			}
			else{
			echo '{"status":"no","error":"Gerekli bilgiler bulunamadı."}';
			}

		}
		else{
			$this->ErrorMessage = "Alanları boş bırakamazsın!";
		}
	}

	function PrintHeader(){
		//Hataları gösterme
		//derror_reporting(0);
		//Cevapları text halinde almak için headerları ayarla
		header('Content-Type: text/plain');
		header("Access-Control-Allow-Origin: *");
		header("Access-Control-Allow-Headers: Content-type");
	}

	//Database bağlantı testi
	function TryConnectToDB(){
		try
		{
			$this->Database = new PDO("mysql:host=localhost;dbname=soneqeqy_c2c;charset=utf8",'soneqeqy_c2c','c2c321');
			$this->Database->query("SET CHARACTER SET utf8");
		}
		catch(PDOException $e)
		{
			//Hata çıkarsa değişkene at ve false döndür
			$ErrorMessage = $e->getMessage();
			return false;
		}
		//Sıkıntı çıkmazsa true döndür
		return true;
	}
}
$Class = new ChatClass();

?>
