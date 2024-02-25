import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgIconsModule } from '@ng-icons/core';
import { AppComponent } from './app.component';
import { GraphEditorComponent } from './components/graph-editor/graph-editor.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu'
import { ClipboardModule } from '@angular/cdk/clipboard';

import {
  remixFolderOpenLine,
  remixSave3Fill,
  remixFileSearchFill,
  remixBarChartGroupedFill
} from '@ng-icons/remixicon'

import {
  featherActivity,
  featherAirplay,
  featherAlertCircle,
  featherAlertOctagon,
  featherAlertTriangle,
  featherAlignCenter,
  featherAlignJustify,
  featherAlignLeft,
  featherAlignRight,
  featherAnchor,
  featherAperture,
  featherArchive,
  featherArrowDownCircle,
  featherArrowDownLeft,
  featherArrowDownRight,
  featherArrowDown,
  featherArrowLeftCircle,
  featherArrowLeft,
  featherArrowRightCircle,
  featherArrowRight,
  featherArrowUpCircle,
  featherArrowUpLeft,
  featherArrowUpRight,
  featherArrowUp,
  featherAtSign,
  featherAward,
  featherBarChart2,
  featherBarChart,
  featherBatteryCharging,
  featherBattery,
  featherBellOff,
  featherBell,
  featherBluetooth,
  featherBold,
  featherBookOpen,
  featherBook,
  featherBookmark,
  featherBox,
  featherBriefcase,
  featherCalendar,
  featherCameraOff,
  featherCamera,
  featherCast,
  featherCheckCircle,
  featherCheckSquare,
  featherCheck,
  featherChevronDown,
  featherChevronLeft,
  featherChevronRight,
  featherChevronUp,
  featherChevronsDown,
  featherChevronsLeft,
  featherChevronsRight,
  featherChevronsUp,
  featherCircle,
  featherClipboard,
  featherClock,
  featherCloudDrizzle,
  featherCloudLightning,
  featherCloudOff,
  featherCloudRain,
  featherCloudSnow,
  featherCloud,
  featherCode,
  featherCommand,
  featherCompass,
  featherCopy,
  featherCornerDownLeft,
  featherCornerDownRight,
  featherCornerLeftDown,
  featherCornerLeftUp,
  featherCornerRightDown,
  featherCornerRightUp,
  featherCornerUpLeft,
  featherCornerUpRight,
  featherCpu,
  featherCreditCard,
  featherCrop,
  featherCrosshair,
  featherDatabase,
  featherDelete,
  featherDisc,
  featherDollarSign,
  featherDownloadCloud,
  featherDownload,
  featherDroplet,
  featherEdit2,
  featherEdit3,
  featherEdit,
  featherExternalLink,
  featherEyeOff,
  featherEye,
  featherFastForward,
  featherFeather,
  featherFileMinus,
  featherFilePlus,
  featherFileText,
  featherFile,
  featherFilm,
  featherFilter,
  featherFlag,
  featherFolderMinus,
  featherFolderPlus,
  featherFolder,
  featherGift,
  featherGitBranch,
  featherGitCommit,
  featherGitMerge,
  featherGitPullRequest,
  featherGlobe,
  featherGrid,
  featherHardDrive,
  featherHash,
  featherHeadphones,
  featherHeart,
  featherHelpCircle,
  featherHome,
  featherImage,
  featherInbox,
  featherInfo,
  featherItalic,
  featherLayers,
  featherLayout,
  featherLifeBuoy,
  featherLink2,
  featherLink,
  featherList,
  featherLoader,
  featherLock,
  featherLogIn,
  featherLogOut,
  featherMail,
  featherMapPin,
  featherMap,
  featherMaximize2,
  featherMaximize,
  featherMenu,
  featherMessageCircle,
  featherMessageSquare,
  featherMicOff,
  featherMic,
  featherMinimize2,
  featherMinimize,
  featherMinusCircle,
  featherMinusSquare,
  featherMinus,
  featherMonitor,
  featherMoon,
  featherMoreHorizontal,
  featherMoreVertical,
  featherMove,
  featherMusic,
  featherNavigation2,
  featherNavigation,
  featherOctagon,
  featherPackage,
  featherPaperclip,
  featherPauseCircle,
  featherPause,
  featherPercent,
  featherPhoneCall,
  featherPhoneForwarded,
  featherPhoneIncoming,
  featherPhoneMissed,
  featherPhoneOff,
  featherPhoneOutgoing,
  featherPhone,
  featherPieChart,
  featherPlayCircle,
  featherPlay,
  featherPlusCircle,
  featherPlusSquare,
  featherPlus,
  featherPocket,
  featherPower,
  featherPrinter,
  featherRadio,
  featherRefreshCcw,
  featherRefreshCw,
  featherRepeat,
  featherRewind,
  featherRotateCcw,
  featherRotateCw,
  featherRss,
  featherSave,
  featherScissors,
  featherSearch,
  featherSend,
  featherServer,
  featherSettings,
  featherShare2,
  featherShare,
  featherShieldOff,
  featherShield,
  featherShoppingBag,
  featherShoppingCart,
  featherShuffle,
  featherSidebar,
  featherSkipBack,
  featherSkipForward,
  featherSlash,
  featherSliders,
  featherSmartphone,
  featherSpeaker,
  featherSquare,
  featherStar,
  featherStopCircle,
  featherSun,
  featherSunrise,
  featherSunset,
  featherTablet,
  featherTag,
  featherTarget,
  featherTerminal,
  featherThermometer,
  featherThumbsDown,
  featherThumbsUp,
  featherToggleLeft,
  featherToggleRight,
  featherTrash2,
  featherTrash,
  featherTrendingDown,
  featherTrendingUp,
  featherTriangle,
  featherTruck,
  featherTv,
  featherType,
  featherUmbrella,
  featherUnderline,
  featherUnlock,
  featherUploadCloud,
  featherUpload,
  featherUserCheck,
  featherUserMinus,
  featherUserPlus,
  featherUserX,
  featherUser,
  featherUsers,
  featherVideoOff,
  featherVideo,
  featherVoicemail,
  featherVolume1,
  featherVolume2,
  featherVolumeX,
  featherVolume,
  featherWatch,
  featherWifiOff,
  featherWifi,
  featherWind,
  featherXCircle,
  featherXSquare,
  featherX,
  featherZapOff,
  featherZap,
  featherZoomIn,
  featherZoomOut,
} from '@ng-icons/feather-icons';

import {
  octTelescope,
  octDash,
  octTrash,
  octThreeBars,
  octGift,
  octAlertFill,
  octCircleSlash,
  octCheckCircleFill,
  octLinkExternal,
  octLaw,
  octEye,
  octChecklist,
  octBellFill,
  octInfo,
  octRocket,
  octShieldCheck,
  octVerified,
  octPaperclip,
  octFeedMerged,
  octVersions,
  octDiffRemoved,
  octGitMerge,
  octChevronDown,
  octCodeSquare,
  octMarkGithub,
  octPlus,
  octGitBranch,
  octCheck,
  octCode,
  octBlocked,
  octFeedForked,
  octLogoGithub,
  octLock,
  octFile,
  octFileAdded,
  octKey,
  octTerminal,
  octPencil,
  octCopy,
  octRepo,
  octRepoForked,
  octStar,
  octPlay,
  octDownload,
  octStarFill,
  octCpu,
  octQuestion,
  octDiffAdded,
  octBook,
  octFileDirectoryFill,
  octBroadcast,
  octHistory,
  octLightBulb,
  octMoon,
  octFeedDiscussion
} from '@ng-icons/octicons';

import {
  tablerHome,
  tablerGridDots,
  tablerPlayerPauseFilled,
  tablerWorld,
  tablerWorldOff,
  tablerPlayerPlayFilled,
  tablerPlayerStopFilled,
  tablerVariable,
  tablerBracketsContain,
  tablerDeviceDesktop,
  tablerWall,
  tablerCpu,
  tablerPlusEqual,
  tablerLogicNand,
  tablerCursorText,
  tablerArrowsJoin,
  tablerArrowsMinimize,
  tablerArrowsMaximize
} from '@ng-icons/tabler-icons';

import {
  simpleGithub,
  simpleTwitter,
  simpleDiscord,
  simpleAmazons3
} from '@ng-icons/simple-icons';

import { ReteModule } from 'rete-angular-plugin/16';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { BaseNodeComponent } from './components/rete/node/basenode.component';
import { BaseSocketComponent } from './components/rete/socket/basesocket.component';
import { BaseConnectionComponent } from './components/rete/connection/baseconnection.component';
import { BaseControlComponent } from './components/basecontrol/basecontrol.component';
import { SanitizeHtmlPipe } from './pipe/sanitizer';
import { SafePipe } from './pipe/safe.pipe';
import { KeyPipe } from './pipe/key.pipe';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { VscodeTextAreaValueAccessorDirective } from './directives/vscode-text-area';
import { NotificationComponent } from './components/noitifcation/notification.component';
import { GatewayService } from './services/gateway.service';
import { environment } from 'src/environments/environment';


@NgModule({
  declarations: [
    AppComponent,

    BaseNodeComponent,
    BaseSocketComponent,
    BaseConnectionComponent,

    GraphEditorComponent,
    BaseControlComponent,
    SidebarComponent,
    NotificationComponent,

    // Pipes
    SanitizeHtmlPipe,
    SafePipe,
    KeyPipe,

    // Directives
    VscodeTextAreaValueAccessorDirective
  ],
  imports: [
    BrowserModule,
    NgIconsModule.withIcons({
      simpleGithub,
      simpleTwitter,
      simpleDiscord,
      simpleAmazons3,

      tablerWorld,
      tablerHome,
      tablerGridDots,
      tablerVariable,
      tablerBracketsContain,
      tablerPlayerStopFilled,
      tablerPlayerPlayFilled,
      tablerPlayerPauseFilled,
      tablerWorldOff,
      tablerDeviceDesktop,
      tablerWall,
      tablerCpu,
      tablerPlusEqual,
      tablerLogicNand,
      tablerCursorText,
      tablerArrowsJoin,
      tablerArrowsMinimize,
      tablerArrowsMaximize,

      octKey,
      octTerminal,
      octBlocked,
      octCheck,
      octGitBranch,
      octInfo,
      octAlertFill,
      octQuestion,
      octPaperclip,
      octFeedMerged,
      octPlay,
      octChecklist,
      octGitMerge,
      octCodeSquare,
      octFeedForked,
      octChevronDown,
      octLightBulb,
      octMoon,
      octFile,
      octFileAdded,
      octCode,
      octThreeBars,
      octBellFill,
      octCircleSlash,
      octCheckCircleFill,
      octLinkExternal,
      octLaw,
      octEye,
      octLogoGithub,
      octDiffRemoved,
      octMarkGithub,
      octPlus,
      octBook,
      octLock,
      octFileDirectoryFill,
      octDiffAdded,
      octBroadcast,
      octHistory,
      octRocket,
      octShieldCheck,
      octVerified,
      octTelescope,
      octDash,
      octTrash,
      octGift,
      octFeedDiscussion,
      octVersions,
      octPencil,
      octCopy,
      octRepo,
      octRepoForked,
      octCpu,
      octStar,
      octStarFill,
      octDownload,

      // Remix
      remixFolderOpenLine,
      remixSave3Fill,
      remixFileSearchFill,
      remixBarChartGroupedFill,

      // Feather icons (especially used for Github Actions)
      featherActivity,
      featherAirplay,
      featherAlertCircle,
      featherAlertOctagon,
      featherAlertTriangle,
      featherAlignCenter,
      featherAlignJustify,
      featherAlignLeft,
      featherAlignRight,
      featherAnchor,
      featherAperture,
      featherArchive,
      featherArrowDownCircle,
      featherArrowDownLeft,
      featherArrowDownRight,
      featherArrowDown,
      featherArrowLeftCircle,
      featherArrowLeft,
      featherArrowRightCircle,
      featherArrowRight,
      featherArrowUpCircle,
      featherArrowUpLeft,
      featherArrowUpRight,
      featherArrowUp,
      featherAtSign,
      featherAward,
      featherBarChart2,
      featherBarChart,
      featherBatteryCharging,
      featherBattery,
      featherBellOff,
      featherBell,
      featherBluetooth,
      featherBold,
      featherBookOpen,
      featherBook,
      featherBookmark,
      featherBox,
      featherBriefcase,
      featherCalendar,
      featherCameraOff,
      featherCamera,
      featherCast,
      featherCheckCircle,
      featherCheckSquare,
      featherCheck,
      featherChevronDown,
      featherChevronLeft,
      featherChevronRight,
      featherChevronUp,
      featherChevronsDown,
      featherChevronsLeft,
      featherChevronsRight,
      featherChevronsUp,
      featherCircle,
      featherClipboard,
      featherClock,
      featherCloudDrizzle,
      featherCloudLightning,
      featherCloudOff,
      featherCloudRain,
      featherCloudSnow,
      featherCloud,
      featherCode,
      featherCommand,
      featherCompass,
      featherCopy,
      featherCornerDownLeft,
      featherCornerDownRight,
      featherCornerLeftDown,
      featherCornerLeftUp,
      featherCornerRightDown,
      featherCornerRightUp,
      featherCornerUpLeft,
      featherCornerUpRight,
      featherCpu,
      featherCreditCard,
      featherCrop,
      featherCrosshair,
      featherDatabase,
      featherDelete,
      featherDisc,
      featherDollarSign,
      featherDownloadCloud,
      featherDownload,
      featherDroplet,
      featherEdit2,
      featherEdit3,
      featherEdit,
      featherExternalLink,
      featherEyeOff,
      featherEye,
      featherFastForward,
      featherFeather,
      featherFileMinus,
      featherFilePlus,
      featherFileText,
      featherFile,
      featherFilm,
      featherFilter,
      featherFlag,
      featherFolderMinus,
      featherFolderPlus,
      featherFolder,
      featherGift,
      featherGitBranch,
      featherGitCommit,
      featherGitMerge,
      featherGitPullRequest,
      featherGlobe,
      featherGrid,
      featherHardDrive,
      featherHash,
      featherHeadphones,
      featherHeart,
      featherHelpCircle,
      featherHome,
      featherImage,
      featherInbox,
      featherInfo,
      featherItalic,
      featherLayers,
      featherLayout,
      featherLifeBuoy,
      featherLink2,
      featherLink,
      featherList,
      featherLoader,
      featherLock,
      featherLogIn,
      featherLogOut,
      featherMail,
      featherMapPin,
      featherMap,
      featherMaximize2,
      featherMaximize,
      featherMenu,
      featherMessageCircle,
      featherMessageSquare,
      featherMicOff,
      featherMic,
      featherMinimize2,
      featherMinimize,
      featherMinusCircle,
      featherMinusSquare,
      featherMinus,
      featherMonitor,
      featherMoon,
      featherMoreHorizontal,
      featherMoreVertical,
      featherMove,
      featherMusic,
      featherNavigation2,
      featherNavigation,
      featherOctagon,
      featherPackage,
      featherPaperclip,
      featherPauseCircle,
      featherPause,
      featherPercent,
      featherPhoneCall,
      featherPhoneForwarded,
      featherPhoneIncoming,
      featherPhoneMissed,
      featherPhoneOff,
      featherPhoneOutgoing,
      featherPhone,
      featherPieChart,
      featherPlayCircle,
      featherPlay,
      featherPlusCircle,
      featherPlusSquare,
      featherPlus,
      featherPocket,
      featherPower,
      featherPrinter,
      featherRadio,
      featherRefreshCcw,
      featherRefreshCw,
      featherRepeat,
      featherRewind,
      featherRotateCcw,
      featherRotateCw,
      featherRss,
      featherSave,
      featherScissors,
      featherSearch,
      featherSend,
      featherServer,
      featherSettings,
      featherShare2,
      featherShare,
      featherShieldOff,
      featherShield,
      featherShoppingBag,
      featherShoppingCart,
      featherShuffle,
      featherSidebar,
      featherSkipBack,
      featherSkipForward,
      featherSlash,
      featherSliders,
      featherSmartphone,
      featherSpeaker,
      featherSquare,
      featherStar,
      featherStopCircle,
      featherSun,
      featherSunrise,
      featherSunset,
      featherTablet,
      featherTag,
      featherTarget,
      featherTerminal,
      featherThermometer,
      featherThumbsDown,
      featherThumbsUp,
      featherToggleLeft,
      featherToggleRight,
      featherTrash2,
      featherTrash,
      featherTrendingDown,
      featherTrendingUp,
      featherTriangle,
      featherTruck,
      featherTv,
      featherType,
      featherUmbrella,
      featherUnderline,
      featherUnlock,
      featherUploadCloud,
      featherUpload,
      featherUserCheck,
      featherUserMinus,
      featherUserPlus,
      featherUserX,
      featherUser,
      featherUsers,
      featherVideoOff,
      featherVideo,
      featherVoicemail,
      featherVolume1,
      featherVolume2,
      featherVolumeX,
      featherVolume,
      featherWatch,
      featherWifiOff,
      featherWifi,
      featherWind,
      featherXCircle,
      featherXSquare,
      featherX,
      featherZapOff,
      featherZap,
      featherZoomIn,
      featherZoomOut,

    }),
    MatTooltipModule,
    ClipboardModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MatSnackBarModule,
    ReteModule,
    FormsModule,

    // menu
    CdkMenuTrigger,
    CdkMenu,
    CdkMenuItem,
  ],
  providers: [
    {
      provide: GatewayService, useFactory: (): GatewayService | null => {
        if (environment.dev || environment.web) {
          return new GatewayService();
        }
        return null;
      }
    },
    { provide: LocationStrategy, useClass: HashLocationStrategy },
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule { }
